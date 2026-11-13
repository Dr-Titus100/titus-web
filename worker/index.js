// The Cloudflare Worker for titusnyarkonde.com. Static files in dist/ are served as before. This
// script answers only /api/* (see run_worker_first in wrangler.jsonc), which is the blog comments API.
//
//   GET  /api/comments?post=<slug>   approved comments on one post
//   POST /api/comments               a new comment, held until Titus approves it
//   GET  /api/comments/admin         every comment, for the moderation page (needs the admin token)
//   POST /api/comments/admin         approve or delete one comment (needs the admin token)
//
// Bindings and secrets, set in wrangler.jsonc or the Cloudflare dashboard:
//   COMMENTS_DB              D1 database. Wrangler creates it on the first deploy. The table is created here.
//   COMMENTS_LIMIT           rate limiter for new comments, keyed by the visitor's IP address. The address is never stored.
//   ADMIN_LIMIT              rate limiter for the moderation API, keyed the same way.
//   COMMENTS_ADMIN_TOKEN     secret, at least 32 characters. The moderation page sends it. Without it, moderation is off.
//   TURNSTILE_SECRET         optional secret. When set, every new comment must pass a Turnstile check.
//   NOTIFY_EMAIL             Cloudflare Email Service binding, for the email Titus gets about each new comment.
//   NOTIFY_TO                secret, the address that gets those emails. It lives only in Cloudflare, never in
//                            this repo or on the site. Without it, no emails go out.
//
// The database keeps only the post, the name, the comment, its status and the time.

const NAME_MAX = 60;
const BODY_MAX = 2000;
// New comments stop being accepted while this many wait for approval, so a flood can't fill the database.
const PENDING_MAX = 200;
// The moderation page lists this many approved comments, newest first.
const APPROVED_SHOWN = 500;
// A post shows at most this many comments, the newest ones.
const POST_SHOWN = 500;
const SLUG = /^[a-z0-9][a-z0-9-]{0,99}$/;
// The sender of the new-comment emails. titusnyarkonde.com must be set up for sending in Email Service.
const NOTIFY_FROM = { email: "comments@titusnyarkonde.com", name: "titusnyarkonde.com comments" };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    try {
      if (url.pathname === "/api/comments") {
        if (request.method === "GET") return await listApproved(url, env);
        if (request.method === "POST") return await addComment(request, url, env, ctx);
        return json({ error: "method" }, 405, { Allow: "GET, POST" });
      }
      if (url.pathname === "/api/comments/admin") {
        if (request.method === "GET" || request.method === "POST") return await admin(request, url, env);
        return json({ error: "method" }, 405, { Allow: "GET, POST" });
      }
      return json({ error: "not-found" }, 404);
    } catch (err) {
      console.error("comments API error", err && err.stack ? err.stack : err);
      return json({ error: "server" }, 500);
    }
  },
};

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      ...extra,
    },
  });
}

let schemaReady = false;
async function db(env) {
  if (!env.COMMENTS_DB) return null;
  if (!schemaReady) {
    await env.COMMENTS_DB.batch([
      env.COMMENTS_DB.prepare(`CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post TEXT NOT NULL,
        name TEXT NOT NULL,
        body TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
        created_at TEXT NOT NULL
      )`),
      env.COMMENTS_DB.prepare("CREATE INDEX IF NOT EXISTS comments_by_post ON comments (post, status, created_at)"),
    ]);
    schemaReady = true;
  }
  return env.COMMENTS_DB;
}

async function overLimit(limiter, key) {
  if (!limiter) return false;
  const { success } = await limiter.limit({ key });
  return !success;
}

const ip = (request) => request.headers.get("CF-Connecting-IP") || "unknown";

// Removes control characters (keeping line breaks), trims, and joins runs of blank lines.
function tidy(value, multiline) {
  let s = String(value ?? "").normalize("NFC").replace(/\r\n?/g, "\n");
  s = s.replace(multiline ? /[\u0000-\u0009\u000B-\u001F\u007F-\u009F​-‏‪-‮⁦-⁩﻿]/g
    : /[\u0000-\u001F\u007F-\u009F​-‏‪-‮⁦-⁩﻿]/g, "");
  if (!multiline) s = s.replace(/\s+/g, " ");
  return s.replace(/\n{3,}/g, "\n\n").trim();
}

async function listApproved(url, env) {
  const post = url.searchParams.get("post") || "";
  if (!SLUG.test(post)) return json({ error: "post" }, 400);
  const d1 = await db(env);
  if (!d1) return json({ error: "unavailable" }, 503);
  // The newest POST_SHOWN comments, put back in reading order, plus the total. So a newly approved
  // comment always shows, even on a post with a very long thread.
  const [latest, total] = await d1.batch([
    d1.prepare("SELECT id, name, body, created_at AS created FROM comments WHERE post = ? AND status = 'approved' ORDER BY created_at DESC, id DESC LIMIT ?")
      .bind(post, POST_SHOWN),
    d1.prepare("SELECT COUNT(*) AS n FROM comments WHERE post = ? AND status = 'approved'").bind(post),
  ]);
  return json({ comments: latest.results.reverse(), total: total.results[0].n });
}

async function addComment(request, url, env, ctx) {
  // Only pages on this site may post. Browsers always send Origin on a cross-site POST.
  const origin = request.headers.get("Origin");
  if (origin && origin !== url.origin) return json({ error: "origin" }, 403);
  if (!(request.headers.get("Content-Type") || "").includes("application/json")) return json({ error: "type" }, 415);
  if (Number(request.headers.get("Content-Length") || 0) > 16_000) return json({ error: "size" }, 413);
  if (await overLimit(env.COMMENTS_LIMIT, ip(request))) return json({ error: "busy" }, 429);

  let input;
  try { input = await request.json(); } catch { return json({ error: "invalid" }, 400); }
  if (!input || typeof input !== "object") return json({ error: "invalid" }, 400);
  // People never see the hidden "trap" checkbox. Bots that tick every box get a quiet success.
  if (input.trap) return json({ status: "pending" }, 202);

  const post = String(input.post || "");
  const name = tidy(input.name, false);
  const body = tidy(input.body, true);
  if (!SLUG.test(post)) return json({ error: "post" }, 400);
  if (!name || name.length > NAME_MAX) return json({ error: "name" }, 400);
  if (!body || body.length > BODY_MAX) return json({ error: "body" }, 400);

  // The post must be a real page on the site.
  const page = await env.ASSETS.fetch(new Request(new URL(`/blog/${post}/`, url.origin), { method: "GET" }));
  if (page.status !== 200) return json({ error: "post" }, 400);

  if (env.TURNSTILE_SECRET) {
    const ok = await turnstile(env.TURNSTILE_SECRET, String(input.token || ""), ip(request));
    if (!ok) return json({ error: "check" }, 400);
  }

  const d1 = await db(env);
  if (!d1) return json({ error: "unavailable" }, 503);
  const waiting = await d1.prepare("SELECT COUNT(*) AS n FROM comments WHERE status = 'pending'").first("n");
  if (waiting >= PENDING_MAX) return json({ error: "full" }, 503);
  await d1.prepare("INSERT INTO comments (post, name, body, status, created_at) VALUES (?, ?, ?, 'pending', ?)")
    .bind(post, name, body, new Date().toISOString()).run();
  // The email goes out after the reply, so a slow or failed send never holds up the reader.
  ctx.waitUntil(notify(env, url, page, { post, name, body, waiting: waiting + 1 }));
  return json({ status: "pending" }, 202);
}

// Emails Titus about a new comment, with the text and a link to the moderation page. Errors only
// go to the Worker's logs: the comment is already saved, and it shows on the moderation page anyway.
async function notify(env, url, page, c) {
  if (!env.NOTIFY_EMAIL || !env.NOTIFY_TO) return;
  try {
    const title = ((await page.text()).match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1]?.replace(/<[^>]+>/g, "")
      .replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim() || c.post;
    const site = `https://${NOTIFY_FROM.email.split("@")[1]}`;
    const text = [
      `${c.name} commented on "${title}":`,
      "",
      c.body,
      "",
      `Approve or delete it: ${site}/admin/comments/`,
      `The post: ${site}/blog/${c.post}/`,
      "",
      c.waiting === 1 ? "This is the only comment waiting for you." : `${c.waiting} comments are waiting for you.`,
    ].join("\n");
    await env.NOTIFY_EMAIL.send({
      to: env.NOTIFY_TO,
      from: NOTIFY_FROM,
      subject: `New comment from ${c.name} on "${title}"`.slice(0, 200),
      text,
    });
  } catch (err) {
    console.error("new-comment email failed", err && (err.code || err.message) ? `${err.code || ""} ${err.message || ""}` : err);
  }
}

async function turnstile(secret, token, remoteip) {
  if (!token || token.length > 2048) return false;
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  form.append("remoteip", remoteip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  const out = await res.json().catch(() => ({}));
  return out.success === true;
}

// Compares SHA-256 digests, so the time taken doesn't reveal how much of the token matched.
async function sameToken(given, expected) {
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([given, expected].map((s) => crypto.subtle.digest("SHA-256", enc.encode(s))));
  const x = new Uint8Array(a), y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

async function admin(request, url, env) {
  // A short token could be guessed, so moderation stays off until the secret is long enough.
  if (!env.COMMENTS_ADMIN_TOKEN || env.COMMENTS_ADMIN_TOKEN.length < 32) return json({ error: "admin-off" }, 503);
  const origin = request.headers.get("Origin");
  if (request.method === "POST" && origin && origin !== url.origin) return json({ error: "origin" }, 403);
  if (await overLimit(env.ADMIN_LIMIT, ip(request))) return json({ error: "busy" }, 429);
  const given = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!given || !(await sameToken(given, env.COMMENTS_ADMIN_TOKEN))) return json({ error: "token" }, 401);

  const d1 = await db(env);
  if (!d1) return json({ error: "unavailable" }, 503);

  if (request.method === "GET") {
    // Every waiting comment (PENDING_MAX keeps that list short), then the newest approved ones.
    // The two lists come separately, so a long approved history never hides a waiting comment.
    const cols = "SELECT id, post, name, body, status, created_at AS created FROM comments";
    const [pending, approved, total] = await d1.batch([
      d1.prepare(`${cols} WHERE status = 'pending' ORDER BY created_at DESC, id DESC LIMIT ?`).bind(PENDING_MAX * 2),
      d1.prepare(`${cols} WHERE status = 'approved' ORDER BY created_at DESC, id DESC LIMIT ?`).bind(APPROVED_SHOWN),
      d1.prepare("SELECT COUNT(*) AS n FROM comments WHERE status = 'approved'"),
    ]);
    return json({ comments: [...pending.results, ...approved.results], approvedTotal: total.results[0].n });
  }

  let input;
  try { input = await request.json(); } catch { return json({ error: "invalid" }, 400); }
  const id = Number(input && input.id);
  if (!Number.isInteger(id) || id < 1) return json({ error: "id" }, 400);
  let result;
  if (input.action === "approve") {
    result = await d1.prepare("UPDATE comments SET status = 'approved' WHERE id = ?").bind(id).run();
  } else if (input.action === "delete") {
    result = await d1.prepare("DELETE FROM comments WHERE id = ?").bind(id).run();
  } else {
    return json({ error: "action" }, 400);
  }
  if (!result.meta || result.meta.changes === 0) return json({ error: "missing" }, 404);
  return json({ ok: true });
}

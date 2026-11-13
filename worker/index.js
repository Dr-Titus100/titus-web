// The Cloudflare Worker for titusnyarkonde.com. Static files in dist/ are served as before. This
// script answers only /api/* (see run_worker_first in wrangler.jsonc), which is the blog comments API.
//
//   GET  /api/comments?post=<slug>   approved comments and replies on one post
//   POST /api/comments               a new comment or reply, held until Titus approves it
//   GET  /api/comments/admin         every comment, for the moderation page (needs the admin token)
//   POST /api/comments/admin         approve, delete or reply to one comment (needs the admin token)
//
// Replies are one level deep. A reply to a reply joins the same thread, under the first comment.
// Titus's own replies, posted from the moderation page, carry author = 1 and show an "Author" label.
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
// The database keeps only the post, the name, the comment, its status, the time, the comment it
// replies to and whether Titus wrote it.

const NAME_MAX = 60;
const BODY_MAX = 2000;
// New comments stop being accepted while this many wait for approval, so a flood can't fill the database.
const PENDING_MAX = 200;
// The moderation page lists this many approved comments, newest first.
const APPROVED_SHOWN = 500;
// A post shows at most this many comments, the newest ones.
const POST_SHOWN = 500;
const SLUG = /^[a-z0-9][a-z0-9-]{0,99}$/;
// The name on Titus's replies from the moderation page.
const AUTHOR_NAME = "Titus Nyarko Nde";
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
    const d1 = env.COMMENTS_DB;
    await d1.batch([
      d1.prepare(`CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post TEXT NOT NULL,
        name TEXT NOT NULL,
        body TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
        created_at TEXT NOT NULL
      )`),
      d1.prepare("CREATE INDEX IF NOT EXISTS comments_by_post ON comments (post, status, created_at)"),
    ]);
    // Columns added after the first release. Two Workers starting at once may both try to add one,
    // so "duplicate column" from the slower one is fine.
    const { results } = await d1.prepare("PRAGMA table_info(comments)").all();
    const have = new Set(results.map((c) => c.name));
    const add = [];
    if (!have.has("parent_id")) add.push("ALTER TABLE comments ADD COLUMN parent_id INTEGER");
    if (!have.has("author")) add.push("ALTER TABLE comments ADD COLUMN author INTEGER NOT NULL DEFAULT 0");
    for (const sql of add) {
      try { await d1.prepare(sql).run(); } catch (err) { if (!/duplicate column/i.test(String(err && err.message))) throw err; }
    }
    await d1.prepare("CREATE INDEX IF NOT EXISTS comments_by_parent ON comments (parent_id)").run();
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
  s = s.replace(multiline ? /[\u0000-\u0009\u000B-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g
    : /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, "");
  if (!multiline) s = s.replace(/\s+/g, " ");
  return s.replace(/\n{3,}/g, "\n\n").trim();
}

async function listApproved(url, env) {
  const post = url.searchParams.get("post") || "";
  if (!SLUG.test(post)) return json({ error: "post" }, 400);
  const d1 = await db(env);
  if (!d1) return json({ error: "unavailable" }, 503);
  // The newest POST_SHOWN comments, put back in reading order, with their replies, plus the totals.
  // So a newly approved comment always shows, even on a post with a very long thread.
  const cols = "SELECT id, name, body, created_at AS created, parent_id AS parent, author FROM comments";
  const [tops, replies, totals] = await d1.batch([
    d1.prepare(`${cols} WHERE post = ? AND status = 'approved' AND parent_id IS NULL ORDER BY created_at DESC, id DESC LIMIT ?`)
      .bind(post, POST_SHOWN),
    d1.prepare(`${cols} WHERE post = ? AND status = 'approved' AND parent_id IS NOT NULL ORDER BY created_at, id LIMIT 5000`).bind(post),
    d1.prepare("SELECT COUNT(*) AS everything, SUM(parent_id IS NULL) AS top FROM comments WHERE post = ? AND status = 'approved'").bind(post),
  ]);
  const shown = new Set(tops.results.map((c) => c.id));
  const tidyRow = (c) => ({ ...c, author: c.author === 1 });
  return json({
    comments: [...tops.results.reverse(), ...replies.results.filter((r) => shown.has(r.parent))].map(tidyRow),
    total: totals.results[0].top || 0,
    count: totals.results[0].everything || 0,
  });
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
  const replyTo = input.parent == null ? null : Number(input.parent);
  if (replyTo !== null && (!Number.isInteger(replyTo) || replyTo < 1)) return json({ error: "parent" }, 400);

  // The post must be a real page on the site.
  const page = await env.ASSETS.fetch(new Request(new URL(`/blog/${post}/`, url.origin), { method: "GET" }));
  if (page.status !== 200) return json({ error: "post" }, 400);

  if (env.TURNSTILE_SECRET) {
    const ok = await turnstile(env.TURNSTILE_SECRET, String(input.token || ""), ip(request));
    if (!ok) return json({ error: "check" }, 400);
  }

  const d1 = await db(env);
  if (!d1) return json({ error: "unavailable" }, 503);
  // A reply goes under an approved comment on the same post. A reply to a reply joins that thread.
  let parent = null;
  if (replyTo !== null) {
    const target = await d1.prepare("SELECT id, name, parent_id FROM comments WHERE id = ? AND post = ? AND status = 'approved'")
      .bind(replyTo, post).first();
    if (!target) return json({ error: "parent" }, 400);
    parent = { id: target.parent_id ?? target.id, name: target.name };
  }
  const waiting = await d1.prepare("SELECT COUNT(*) AS n FROM comments WHERE status = 'pending'").first("n");
  if (waiting >= PENDING_MAX) return json({ error: "full" }, 503);
  await d1.prepare("INSERT INTO comments (post, name, body, status, created_at, parent_id) VALUES (?, ?, ?, 'pending', ?, ?)")
    .bind(post, name, body, new Date().toISOString(), parent ? parent.id : null).run();
  // The email goes out after the response, so a slow or failed send never holds up the reader.
  ctx.waitUntil(notify(env, url, page, { post, name, body, waiting: waiting + 1, replyTo: parent && parent.name }));
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
      c.replyTo ? `${c.name} replied to ${c.replyTo} on "${title}":` : `${c.name} commented on "${title}":`,
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
      subject: `${c.replyTo ? "New reply" : "New comment"} from ${c.name} on "${title}"`.slice(0, 200),
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
    const cols = `SELECT c.id, c.post, c.name, c.body, c.status, c.created_at AS created, c.parent_id AS parent,
      c.author, p.name AS parentName FROM comments c LEFT JOIN comments p ON p.id = c.parent_id`;
    const [pending, approved, total] = await d1.batch([
      d1.prepare(`${cols} WHERE c.status = 'pending' ORDER BY c.created_at DESC, c.id DESC LIMIT ?`).bind(PENDING_MAX * 2),
      d1.prepare(`${cols} WHERE c.status = 'approved' ORDER BY c.created_at DESC, c.id DESC LIMIT ?`).bind(APPROVED_SHOWN),
      d1.prepare("SELECT COUNT(*) AS n FROM comments WHERE status = 'approved'"),
    ]);
    const rows = [...pending.results, ...approved.results].map((c) => ({ ...c, author: c.author === 1 }));
    return json({ comments: rows, approvedTotal: total.results[0].n });
  }

  let input;
  try { input = await request.json(); } catch { return json({ error: "invalid" }, 400); }
  const id = Number(input && input.id);
  if (!Number.isInteger(id) || id < 1) return json({ error: "id" }, 400);
  let result;
  if (input.action === "approve") {
    result = await d1.prepare("UPDATE comments SET status = 'approved' WHERE id = ?").bind(id).run();
  } else if (input.action === "delete") {
    // Deleting a comment deletes its replies too.
    result = await d1.prepare("DELETE FROM comments WHERE id = ? OR parent_id = ?").bind(id, id).run();
  } else if (input.action === "reply") {
    const body = tidy(input.body, true);
    if (!body || body.length > BODY_MAX) return json({ error: "body" }, 400);
    const target = await d1.prepare("SELECT id, post, parent_id FROM comments WHERE id = ?").bind(id).first();
    if (!target) return json({ error: "missing" }, 404);
    const root = target.parent_id ?? target.id;
    // Replying to a waiting comment approves it, and its thread's first comment, so the reply has a place to show.
    await d1.batch([
      d1.prepare("UPDATE comments SET status = 'approved' WHERE id IN (?, ?) AND status = 'pending'").bind(target.id, root),
      d1.prepare("INSERT INTO comments (post, name, body, status, created_at, parent_id, author) VALUES (?, ?, ?, 'approved', ?, ?, 1)")
        .bind(target.post, AUTHOR_NAME, body, new Date().toISOString(), root),
    ]);
    return json({ ok: true });
  } else {
    return json({ error: "action" }, 400);
  }
  if (!result.meta || result.meta.changes === 0) return json({ error: "missing" }, 404);
  return json({ ok: true });
}

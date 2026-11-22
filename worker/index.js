// The Cloudflare Worker for titusnyarkonde.com. Static files in dist/ are served as before. This
// script answers /api/* (see run_worker_first in wrangler.jsonc), which is the comments API for
// blog posts and the reviews of games, and /media/*, so videos can be skipped forward and back (see media()).
//
// A "post" is a blog post's slug, such as my-first-post, or a game, such as games/sankofa-snake. A
// game's reviews live on its Play page. A review is a comment with a rating from 1 to 10, and it may
// name the player's favorite level. Replies to reviews carry no rating, like replies on blog posts.
//
//   GET  /api/comments?post=<slug>   approved comments and replies on one post, and for a game the rating summary
//   POST /api/comments               a new comment or reply. It shows at once when the spam check is on,
//                                    and otherwise waits until Titus approves it
//   POST /api/comments/report        a reader reports a comment, review or reply, with one of the REASONS below.
//                                    It flags the comment on the moderation page and hides nothing by itself
//   GET  /api/comments/admin         every comment, for the moderation page (needs the admin token)
//   POST /api/comments/admin         approve, delete or reply to one comment, clear its reports, or post
//                                    Titus's own comment on a post (needs the admin token)
//
// Replies are one level deep. A reply to a reply joins the same thread, under the first comment.
// Titus's own replies, posted from the moderation page, carry author = 1 and show an "Author" label.
//
// Bindings and secrets, set in wrangler.jsonc or the Cloudflare dashboard:
//   COMMENTS_DB              D1 database. Wrangler creates it on the first deploy. The table is created here.
//   COMMENTS_LIMIT           rate limiter for new comments, keyed by the visitor's IP address. The address is never stored.
//   ADMIN_LIMIT              rate limiter for the moderation API, keyed the same way.
//   REPORT_LIMIT             rate limiter for reports, keyed the same way.
//   COMMENTS_ADMIN_TOKEN     secret, at least 32 characters. The moderation page sends it. Without it, moderation is off.
//   TURNSTILE_SECRET         optional secret. When set, every new comment must pass a Turnstile check, and
//                            comments that pass show at once. Without it, every new comment waits for approval.
//   NOTIFY_EMAIL             Cloudflare Email Service binding, for the email Titus gets about each new comment.
//   NOTIFY_TO                secret, the address that gets those emails. It lives only in Cloudflare, never in
//                            this repo or on the site. Without it, no emails go out.
//
// The database keeps only the post, the name, the comment, its status, the time, the comment it
// replies to, whether Titus wrote it, and for a game review the rating and favorite level. A report
// keeps the comment, the reason, how many times that reason came in and the time of the latest. It
// doesn't keep who sent it.

import { media } from "./media.js";

const NAME_MAX = 60;
// The longest comment or reply, for readers and Titus alike. The text boxes use the same limit.
const BODY_MAX = 3000;
// Without the spam check, new comments stop being accepted while this many wait for approval, so a
// flood can't fill the database.
const PENDING_MAX = 200;
// The moderation page lists this many approved comments, newest first.
const APPROVED_SHOWN = 500;
// A post shows at most this many comments, the newest ones.
const POST_SHOWN = 500;
const SLUG = /^[a-z0-9][a-z0-9-]{0,99}$/;
// A game's reviews, keyed by the game's folder under /games/.
const GAME = /^games\/[a-z0-9][a-z0-9-]{0,59}$/;
// The levels and modes a player can name as a favorite in a review, by game.
const FAVORITES = {
  "games/sankofa-snake": ["farm", "park", "market", "city", "road", "lab", "maze", "ocean", "village", "daily", "free", "practice"],
};
// Why a reader can report a comment. The page shows the words for each one.
const REASONS = ["spam", "rude", "personal", "other"];
// One comment's count for one reason stops here, so a flood of reports can't grow the table.
const REPORT_MAX = 1000;
const validPost = (post) => SLUG.test(post) || GAME.test(post);
const isGame = (post) => GAME.test(post);
// The page a post's comments show on.
const pagePath = (post) => (isGame(post) ? `/${post}/play/` : `/blog/${post}/`);
// The name on Titus's replies from the moderation page.
const AUTHOR_NAME = "Titus Nyarko Nde";
// The sender of the new-comment emails. titusnyarkonde.com must be set up for sending in Email Service.
const NOTIFY_FROM = { email: "comments@titusnyarkonde.com", name: "titusnyarkonde.com comments" };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/media/")) return media(request, env);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    try {
      if (url.pathname === "/api/comments") {
        if (request.method === "GET") return await listApproved(url, env);
        if (request.method === "POST") return await addComment(request, url, env, ctx);
        return json({ error: "method" }, 405, { Allow: "GET, POST" });
      }
      if (url.pathname === "/api/comments/report") {
        if (request.method === "POST") return await addReport(request, url, env, ctx);
        return json({ error: "method" }, 405, { Allow: "POST" });
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
      // One row for each comment and reason, with a count, so repeat reports don't add rows.
      d1.prepare(`CREATE TABLE IF NOT EXISTS reports (
        comment_id INTEGER NOT NULL,
        reason TEXT NOT NULL,
        count INTEGER NOT NULL DEFAULT 1,
        last_at TEXT NOT NULL,
        PRIMARY KEY (comment_id, reason)
      )`),
    ]);
    // Columns added after the first release. Two Workers starting at once may both try to add one,
    // so "duplicate column" from the slower one is fine.
    const { results } = await d1.prepare("PRAGMA table_info(comments)").all();
    const have = new Set(results.map((c) => c.name));
    const add = [];
    if (!have.has("parent_id")) add.push("ALTER TABLE comments ADD COLUMN parent_id INTEGER");
    if (!have.has("author")) add.push("ALTER TABLE comments ADD COLUMN author INTEGER NOT NULL DEFAULT 0");
    if (!have.has("rating")) add.push("ALTER TABLE comments ADD COLUMN rating INTEGER");
    if (!have.has("favorite")) add.push("ALTER TABLE comments ADD COLUMN favorite TEXT");
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
  if (!validPost(post)) return json({ error: "post" }, 400);
  const d1 = await db(env);
  if (!d1) return json({ error: "unavailable" }, 503);
  // The newest POST_SHOWN comments, put back in reading order, with their replies, plus the totals.
  // So a newly approved comment always shows, even on a post with a very long thread.
  const cols = "SELECT id, name, body, created_at AS created, parent_id AS parent, author, rating, favorite FROM comments";
  const [tops, replies, totals, scores] = await d1.batch([
    d1.prepare(`${cols} WHERE post = ? AND status = 'approved' AND parent_id IS NULL ORDER BY created_at DESC, id DESC LIMIT ?`)
      .bind(post, POST_SHOWN),
    // Only replies in the threads shown, newest first so a new reply is never cut off, then put in reading order below.
    d1.prepare(`${cols} WHERE post = ? AND status = 'approved' AND parent_id IN (
        SELECT id FROM comments WHERE post = ? AND status = 'approved' AND parent_id IS NULL ORDER BY created_at DESC, id DESC LIMIT ?
      ) ORDER BY created_at DESC, id DESC LIMIT 5000`).bind(post, post, POST_SHOWN),
    d1.prepare("SELECT COUNT(*) AS everything, SUM(parent_id IS NULL) AS top FROM comments WHERE post = ? AND status = 'approved'").bind(post),
    // How many approved reviews gave each rating, over every review and not only the ones shown.
    d1.prepare(`SELECT rating, COUNT(*) AS n FROM comments WHERE post = ? AND status = 'approved' AND parent_id IS NULL
      AND rating IS NOT NULL GROUP BY rating`).bind(post),
  ]);
  const shown = new Set(tops.results.map((c) => c.id));
  const tidyRow = ({ rating, favorite, ...c }) => ({ ...c, author: c.author === 1, ...(rating ? { rating } : {}), ...(favorite ? { favorite } : {}) });
  const out = {
    comments: [...tops.results.reverse(), ...replies.results.reverse().filter((r) => shown.has(r.parent))].map(tidyRow),
    total: totals.results[0].top || 0,
    count: totals.results[0].everything || 0,
  };
  if (isGame(post)) out.ratings = ratingSummary(scores.results);
  return json(out);
}

// The number of ratings, their average to one decimal place, and how many gave each score from 1 to 10.
function ratingSummary(rows) {
  const counts = Array(10).fill(0);
  for (const r of rows) if (r.rating >= 1 && r.rating <= 10) counts[r.rating - 1] = r.n;
  const count = counts.reduce((a, b) => a + b, 0);
  const sum = counts.reduce((a, n, i) => a + n * (i + 1), 0);
  return { count, average: count ? Math.round((sum / count) * 10) / 10 : null, counts };
}

async function addComment(request, url, env, ctx) {
  // Only pages on this site may post. Browsers always send Origin on a cross-site POST.
  const origin = request.headers.get("Origin");
  if (origin && origin !== url.origin) return json({ error: "origin" }, 403);
  if (!(request.headers.get("Content-Type") || "").includes("application/json")) return json({ error: "type" }, 415);
  if (Number(request.headers.get("Content-Length") || 0) > 32_000) return json({ error: "size" }, 413);
  if (await overLimit(env.COMMENTS_LIMIT, ip(request))) return json({ error: "busy" }, 429);

  let input;
  try { input = await request.json(); } catch { return json({ error: "invalid" }, 400); }
  if (!input || typeof input !== "object") return json({ error: "invalid" }, 400);
  // People never see the hidden "trap" checkbox. Bots that tick every box get a quiet success.
  if (input.trap) return json({ status: "pending" }, 202);
  // With the spam check on, a comment that passes it shows at once. Titus can still delete it.
  const live = Boolean(env.TURNSTILE_SECRET);

  const post = String(input.post || "");
  const name = tidy(input.name, false);
  const body = tidy(input.body, true);
  if (!validPost(post)) return json({ error: "post" }, 400);
  if (!name || name.length > NAME_MAX) return json({ error: "name" }, 400);
  const replyTo = input.parent == null ? null : Number(input.parent);
  if (replyTo !== null && (!Number.isInteger(replyTo) || replyTo < 1)) return json({ error: "parent" }, 400);
  // A game review needs a rating from 1 to 10, and its words are optional. Every other comment and
  // every reply needs words and has no rating.
  const review = isGame(post) && replyTo === null;
  const rating = review ? Number(input.rating) : null;
  if (review && !(Number.isInteger(rating) && rating >= 1 && rating <= 10)) return json({ error: "rating" }, 400);
  if ((!review && !body) || body.length > BODY_MAX) return json({ error: "body" }, 400);
  const favorite = review && input.favorite ? String(input.favorite) : null;
  if (favorite !== null && !(FAVORITES[post] || []).includes(favorite)) return json({ error: "favorite" }, 400);

  // The post must be a real page on the site.
  const page = await env.ASSETS.fetch(new Request(new URL(pagePath(post), url.origin), { method: "GET" }));
  if (page.status !== 200) return json({ error: "post" }, 400);

  if (live) {
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
  if (!live && waiting >= PENDING_MAX) return json({ error: "full" }, 503);
  // The insert checks the thread again, so a reply can't land in a thread deleted a moment ago.
  const parentId = parent ? parent.id : null;
  const status = live ? "approved" : "pending";
  const created = new Date().toISOString();
  const saved = await d1.prepare(`INSERT INTO comments (post, name, body, status, created_at, parent_id, rating, favorite)
      SELECT ?, ?, ?, ?, ?, ?, ?, ? WHERE ? IS NULL OR EXISTS (SELECT 1 FROM comments WHERE id = ? AND parent_id IS NULL)`)
    .bind(post, name, body, status, created, parentId, rating, favorite, parentId, parentId).run();
  if (!saved.meta || saved.meta.changes === 0) return json({ error: "parent" }, 400);
  // The email goes out after the response, so a slow or failed send never holds up the reader.
  ctx.waitUntil(notify(env, url, page, { post, name, body, rating, live, waiting: live ? waiting : waiting + 1, replyTo: parent && parent.name }));
  if (!live) return json({ status: "pending" }, 202);
  // The page adds the new comment to the list straight away, without loading them all again.
  const comment = { id: saved.meta.last_row_id, name, body, created, parent: parentId, author: false };
  if (rating) comment.rating = rating;
  if (favorite) comment.favorite = favorite;
  return json({ status: "approved", comment }, 201);
}

// A reader reports a comment. Only approved comments from readers can be reported, since only those
// show on the site. The first report on a comment also sends Titus an email.
async function addReport(request, url, env, ctx) {
  const origin = request.headers.get("Origin");
  if (origin && origin !== url.origin) return json({ error: "origin" }, 403);
  if (!(request.headers.get("Content-Type") || "").includes("application/json")) return json({ error: "type" }, 415);
  if (Number(request.headers.get("Content-Length") || 0) > 2_000) return json({ error: "size" }, 413);
  if (await overLimit(env.REPORT_LIMIT, ip(request))) return json({ error: "busy" }, 429);

  let input;
  try { input = await request.json(); } catch { return json({ error: "invalid" }, 400); }
  if (!input || typeof input !== "object") return json({ error: "invalid" }, 400);
  const id = Number(input.id);
  if (!Number.isInteger(id) || id < 1) return json({ error: "id" }, 400);
  const reason = String(input.reason || "");
  if (!REASONS.includes(reason)) return json({ error: "reason" }, 400);

  const d1 = await db(env);
  if (!d1) return json({ error: "unavailable" }, 503);
  const target = await d1.prepare("SELECT id, post, name, body, rating, parent_id FROM comments WHERE id = ? AND status = 'approved' AND author = 0")
    .bind(id).first();
  if (!target) return json({ error: "missing" }, 404);
  const before = await d1.prepare("SELECT COUNT(*) AS n FROM reports WHERE comment_id = ?").bind(id).first("n");
  const saved = await d1.prepare(`INSERT INTO reports (comment_id, reason, count, last_at)
      SELECT ?, ?, 1, ? WHERE EXISTS (SELECT 1 FROM comments WHERE id = ? AND status = 'approved')
      ON CONFLICT (comment_id, reason) DO UPDATE SET count = MIN(count + 1, ?), last_at = excluded.last_at`)
    .bind(id, reason, new Date().toISOString(), id, REPORT_MAX).run();
  if (!saved.meta || saved.meta.changes === 0) return json({ error: "missing" }, 404);
  if (!before) ctx.waitUntil(notifyReport(env, target, reason));
  return json({ ok: true }, 202);
}

// Emails Titus the first time a comment is reported, so a problem doesn't wait until he next opens the
// moderation page. Later reports on the same comment only add to its count there.
async function notifyReport(env, c, reason) {
  if (!env.NOTIFY_EMAIL || !env.NOTIFY_TO) return;
  try {
    const site = `https://${NOTIFY_FROM.email.split("@")[1]}`;
    const what = { spam: "spam or advertising", rude: "rude, hateful or bullying", personal: "sharing someone's personal information", other: "something else" }[reason];
    const kind = c.rating ? "review" : c.parent_id ? "reply" : "comment";
    const text = [
      `Someone reported a ${kind} by ${c.name} for ${what}.`,
      ...(c.body ? ["", c.body] : []),
      "",
      `The page: ${site}${pagePath(c.post)}`,
      `Keep or delete it: ${site}/admin/comments/`,
    ].join("\n");
    await env.NOTIFY_EMAIL.send({
      to: env.NOTIFY_TO,
      from: NOTIFY_FROM,
      subject: `Reported ${kind} from ${c.name}`.slice(0, 200),
      text,
    });
  } catch (err) {
    console.error("report email failed", err && (err.code || err.message) ? `${err.code || ""} ${err.message || ""}` : err);
  }
}

// Emails Titus about a new comment, with the text, a link to the post and a link to the moderation page. Errors only
// go to the Worker's logs: the comment is already saved, and it shows on the moderation page anyway.
async function notify(env, url, page, c) {
  if (!env.NOTIFY_EMAIL || !env.NOTIFY_TO) return;
  try {
    const title = ((await page.text()).match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1]?.replace(/<[^>]+>/g, "")
      .replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim() || c.post;
    const site = `https://${NOTIFY_FROM.email.split("@")[1]}`;
    const where = `${site}${pagePath(c.post)}`;
    const what = c.rating ? `${c.name} rated "${title}" ${c.rating} out of 10` : c.replyTo ? `${c.name} replied to ${c.replyTo} on "${title}"` : `${c.name} commented on "${title}"`;
    const text = [
      c.body ? `${what}:` : `${what}.`,
      ...(c.body ? ["", c.body] : []),
      "",
      c.live ? `It's on the page now: ${where}` : `The page: ${where}`,
      c.live ? `To delete it: ${site}/admin/comments/` : `Approve or delete it: ${site}/admin/comments/`,
      // Older comments from before the spam check may still be waiting.
      ...(c.waiting ? ["", c.waiting === 1 ? "One comment is waiting for your approval." : `${c.waiting} comments are waiting for your approval.`] : []),
    ].join("\n");
    await env.NOTIFY_EMAIL.send({
      to: env.NOTIFY_TO,
      from: NOTIFY_FROM,
      subject: `${c.rating ? `New ${c.rating}/10 review` : c.replyTo ? "New reply" : "New comment"} from ${c.name} on "${title}"`.slice(0, 200),
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
    // Reported comments come in a third list, so an old one past the approved limit still shows.
    const cols = `SELECT c.id, c.post, c.name, c.body, c.status, c.created_at AS created, c.parent_id AS parent,
      c.author, c.rating, c.favorite, p.name AS parentName,
      (SELECT json_group_object(r.reason, r.count) FROM reports r WHERE r.comment_id = c.id) AS reports
      FROM comments c LEFT JOIN comments p ON p.id = c.parent_id`;
    const [pending, approved, total, reported] = await d1.batch([
      d1.prepare(`${cols} WHERE c.status = 'pending' ORDER BY c.created_at DESC, c.id DESC LIMIT ?`).bind(PENDING_MAX * 2),
      d1.prepare(`${cols} WHERE c.status = 'approved' ORDER BY c.created_at DESC, c.id DESC LIMIT ?`).bind(APPROVED_SHOWN),
      d1.prepare("SELECT COUNT(*) AS n FROM comments WHERE status = 'approved'"),
      d1.prepare(`${cols} WHERE c.id IN (SELECT comment_id FROM reports) ORDER BY c.created_at DESC, c.id DESC LIMIT ?`).bind(APPROVED_SHOWN),
    ]);
    const seen = new Set();
    const rows = [...pending.results, ...approved.results, ...reported.results].filter((c) => !seen.has(c.id) && seen.add(c.id))
      .map(({ reports, ...c }) => {
        let counts = {};
        try { counts = JSON.parse(reports || "{}") || {}; } catch {}
        return { ...c, author: c.author === 1, ...(Object.keys(counts).length ? { reports: counts } : {}) };
      });
    return json({ comments: rows, approvedTotal: total.results[0].n });
  }

  let input;
  try { input = await request.json(); } catch { return json({ error: "invalid" }, 400); }
  if (!input || typeof input !== "object") return json({ error: "invalid" }, 400);
  // Titus's own comment on a post. It shows at once with the Author label.
  if (input.action === "comment") {
    const post = String(input.post || "");
    if (!validPost(post)) return json({ error: "post" }, 400);
    const body = tidy(input.body, true);
    if (!body || body.length > BODY_MAX) return json({ error: "body" }, 400);
    // On a game, Titus's own comment is a note from the author with no rating, so it never changes the average.
    const page = await env.ASSETS.fetch(new Request(new URL(pagePath(post), url.origin), { method: "GET" }));
    if (page.status !== 200) return json({ error: "post" }, 400);
    await d1.prepare("INSERT INTO comments (post, name, body, status, created_at, author) VALUES (?, ?, ?, 'approved', ?, 1)")
      .bind(post, AUTHOR_NAME, body, new Date().toISOString()).run();
    return json({ ok: true });
  }
  const id = Number(input.id);
  if (!Number.isInteger(id) || id < 1) return json({ error: "id" }, 400);
  let result;
  if (input.action === "approve") {
    result = await d1.prepare("UPDATE comments SET status = 'approved' WHERE id = ?").bind(id).run();
  } else if (input.action === "delete") {
    // Deleting a comment deletes its replies too, and the reports on all of them.
    [, result] = await d1.batch([
      d1.prepare("DELETE FROM reports WHERE comment_id IN (SELECT id FROM comments WHERE id = ? OR parent_id = ?)").bind(id, id),
      d1.prepare("DELETE FROM comments WHERE id = ? OR parent_id = ?").bind(id, id),
    ]);
  } else if (input.action === "dismiss") {
    // Keep a reported comment and clear its reports.
    result = await d1.prepare("DELETE FROM reports WHERE comment_id = ?").bind(id).run();
  } else if (input.action === "reply") {
    const body = tidy(input.body, true);
    if (!body || body.length > BODY_MAX) return json({ error: "body" }, 400);
    const target = await d1.prepare("SELECT id, post, parent_id FROM comments WHERE id = ?").bind(id).first();
    if (!target) return json({ error: "missing" }, 404);
    const root = target.parent_id ?? target.id;
    // Replying to a waiting comment approves it, and its thread's first comment, so the reply has a place to show.
    const [, saved] = await d1.batch([
      d1.prepare("UPDATE comments SET status = 'approved' WHERE id IN (?, ?) AND status = 'pending'").bind(target.id, root),
      // Only while the thread still exists, so the reply never lands in a thread deleted a moment ago.
      d1.prepare(`INSERT INTO comments (post, name, body, status, created_at, parent_id, author)
          SELECT ?, ?, ?, 'approved', ?, ?, 1 WHERE EXISTS (SELECT 1 FROM comments WHERE id = ? AND parent_id IS NULL)`)
        .bind(target.post, AUTHOR_NAME, body, new Date().toISOString(), root, root),
    ]);
    if (!saved.meta || saved.meta.changes === 0) return json({ error: "missing" }, 404);
    return json({ ok: true });
  } else {
    return json({ error: "action" }, 400);
  }
  if (!result.meta || result.meta.changes === 0) return json({ error: "missing" }, 404);
  return json({ ok: true });
}

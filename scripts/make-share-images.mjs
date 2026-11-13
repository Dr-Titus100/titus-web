// Makes the 1200 x 630 images that link previews show (og:image), into public/og/.
//
//   npm run share-images -- http://localhost:4321/titus-web
//
// Run it after `npm run build && npx astro preview`, since the titus-humanizer card uses a real
// screenshot of the Checker. It needs Playwright's Chromium (`npx playwright install chromium`).
// It makes:
//   public/og/site.png            the default card: photo, name and "Data scientist"
//   public/og/about.png           the About card: a larger photo
//   public/og/titus-humanizer.png the Checker with the sample text checked
//   public/og/blog/<post>.png     a title card for each blog post
// Commit the images. A post without its own image falls back to site.png.

import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const out = path.join(root, "public/og");
const base = process.argv[2] || "http://localhost:4321/titus-web";
fs.mkdirSync(path.join(out, "blog"), { recursive: true });

const font = (f) => `data:font/woff2;base64,${fs.readFileSync(path.join(root, "src/fonts", f)).toString("base64")}`;
const photo = `data:image/jpeg;base64,${fs.readFileSync(path.join(root, "public/images/titus.jpg")).toString("base64")}`;
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const page = (body) => `<!doctype html><html><head><style>
@font-face { font-family: Inter; src: url(${font("inter-latin-wght-normal.woff2")}) format("woff2"); font-weight: 100 900; }
@font-face { font-family: Inter; src: url(${font("inter-latin-ext-wght-normal.woff2")}) format("woff2"); font-weight: 100 900; unicode-range: U+0100-02BA, U+1E00-1E9F; }
* { box-sizing: border-box; } html, body { margin: 0; }
body { width: 1200px; height: 630px; font-family: Inter, sans-serif; color: #1d1d1f; background: #f5f5f7; overflow: hidden; }
.card { width: 1200px; height: 630px; padding: 72px 80px; display: flex; gap: 64px; align-items: center; }
.eyebrow { font-size: 28px; font-weight: 600; color: #6e6e73; margin: 0 0 16px; }
h1 { font-size: 76px; line-height: 1.04; font-weight: 600; letter-spacing: -0.02em; margin: 0; text-wrap: balance; }
.sub { font-size: 30px; line-height: 1.35; color: #424245; margin: 24px 0 0; }
.foot { position: absolute; left: 80px; bottom: 56px; font-size: 22px; color: #6e6e73; }
img.round { border-radius: 50%; object-fit: cover; flex: none; }
</style></head><body>${body}</body></html>`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
async function shoot(file, html) {
  await p.setContent(page(html), { waitUntil: "load" });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: path.join(out, file) });
  console.log("wrote public/og/" + file);
}

await shoot("site.png", `<div class="card"><div style="flex:1"><p class="eyebrow">Data scientist</p><h1>Titus Nyarko Nde</h1>
  <p class="sub">Machine learning, how far to trust its answers, and tools that help people write clearly with AI.</p></div>
  <img class="round" src="${photo}" width="340" height="340" alt=""></div>`);

await shoot("about.png", `<div class="card"><img class="round" src="${photo}" width="420" height="420" alt="">
  <div style="flex:1"><p class="eyebrow">About</p><h1>Titus Nyarko Nde</h1>
  <p class="sub">Ph.D. in Computing, Boise State University</p></div></div>`);

// The Checker card: a screenshot of the real Checker after it checks the sample text.
const live = await ctx.newPage();
await live.setViewportSize({ width: 1280, height: 900 });
await live.goto(`${base}/tools/titus-humanizer/checker/`);
await live.click("#sample");
await live.waitForSelector("#results:not([hidden])", { timeout: 180000 });
await live.addStyleTag({ content: "#nav, .nav, .subnav { display: none !important; } .results { padding-top: 0 !important; }" });
await live.locator(".results").scrollIntoViewIfNeeded();
await live.waitForTimeout(1500);
const shot = (await live.locator(".results").screenshot()).toString("base64");
await live.close();
await shoot("titus-humanizer.png", `<div class="card" style="padding: 64px 0 0 80px; align-items: flex-start;">
  <div style="width: 420px; flex: none; padding-top: 24px"><p class="eyebrow">titus-humanizer</p><h1 style="font-size: 64px">Plain rewrites that keep every fact</h1></div>
  <img src="data:image/png;base64,${shot}" alt="" style="width: 820px; border-radius: 24px 0 0 0; box-shadow: 0 10px 40px rgba(0,0,0,0.12); align-self: flex-start;"></div>`);

// One title card per blog post, from the post's front matter.
const blogDir = path.join(root, "src/content/blog");
for (const f of fs.readdirSync(blogDir).filter((f) => f.endsWith(".md") && !f.startsWith("_"))) {
  const fm = fs.readFileSync(path.join(blogDir, f), "utf8").match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  const get = (k) => (fm.match(new RegExp(`^${k}:\\s*"?(.*?)"?\\s*$`, "m")) || [])[1] || "";
  if (get("draft") === "true") continue;
  const date = new Date(get("date")).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  const kind = get("fiction") === "true" ? "Fiction" : "Blog";
  await shoot(`blog/${f.replace(/\.md$/, "")}.png`, `<div class="card" style="background:#ffffff; display:block; padding-top: 96px;">
    <p class="eyebrow">${kind} · ${esc(date)}</p><h1 style="max-width: 1000px">${esc(get("title"))}</h1>
    <p class="sub" style="max-width: 940px">${esc(get("description"))}</p>
    <div class="foot">Titus Nyarko Nde</div></div>`);
}
await browser.close();

// Builds the small site that stays on GitHub Pages after the move to the new domain.
// For every page in dist/, it writes a page at the same github.io path that sends the visitor to
// the same page on the new domain, keeping any #section or ?query. Search engines read the
// canonical link and the refresh and move the page to the new address.
//
// Usage: NEW_SITE_URL=https://example.com node scripts/make-forwarders.mjs
// Reads dist/ (built for github.io) and writes dist-forward/.
import { mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const target = (process.env.NEW_SITE_URL || "").replace(/\/+$/, "");
if (!/^https:\/\/[a-z0-9.-]+$/i.test(target)) throw new Error("Set NEW_SITE_URL to the new address, such as https://example.com");

const root = new URL("..", import.meta.url).pathname;
const dist = join(root, "dist");
const out = join(root, "dist-forward");
rmSync(out, { recursive: true, force: true });

const pages = [];
const walk = (d) => readdirSync(d).forEach((f) => {
  const p = join(d, f);
  if (statSync(p).isDirectory()) { if (f !== "vendor" && f !== "skills" && f !== "_astro") walk(p); }
  else if (p.endsWith(".html")) pages.push(relative(dist, p));
});
walk(dist);

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
for (const page of pages) {
  // about/index.html -> /about/ and index.html -> /. GitHub Pages shows 404.html for any address it
  // doesn't have, so that page forwards to the same path on the new domain, or to the home page without scripts.
  const path = page === "404.html" ? "/" : "/" + page.replace(/index\.html$/, "");
  const to = target + path;
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>This page has moved</title>
<link rel="canonical" href="${esc(to)}">
<meta http-equiv="refresh" content="0; url=${esc(to)}">
<script>${page === "404.html" ? `location.replace(${JSON.stringify(target)} + location.pathname.replace(/^\\/titus-web(?=\\/|$)/, "") + location.search + location.hash);` : `location.replace(${JSON.stringify(to)} + location.search + location.hash);`}</script>
</head>
<body>
<p>This site has moved to <a href="${esc(to)}">${esc(to)}</a>.</p>
</body>
</html>
`;
  const file = join(out, page);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}
// Feed readers that subscribed to the old RSS address get a pointer to the new one.
writeFileSync(join(out, "rss.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>Titus Nyarko Nde has moved</title><link>${esc(target)}/</link><description>The blog's feed is now at ${esc(target)}/rss.xml</description></channel></rss>
`);
console.log(`Wrote ${pages.length} forwarding pages to dist-forward/, pointing at ${target}.`);

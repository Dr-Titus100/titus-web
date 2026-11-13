// Adds a Content Security Policy to every built page, as a <meta> tag at the top of <head>.
// GitHub Pages can't send custom headers, so the meta tag is the closest we can get. It can't carry
// frame-ancestors (headers only), so the Rewrite page also hides its key field when it is framed.
//
// Each inline <script> is allowed by its SHA-256 hash, so script-src never needs 'unsafe-inline'.
// Outside hosts are allowed only on the pages that use them: the AI providers on Rewrite, and
// Web3Forms and hCaptcha on pages with the contact form, and Cloudflare Turnstile on blog posts with
// a comment form, when a Turnstile site key is set. The comments API is on this site, so 'self' covers it.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dist = new URL("../dist", import.meta.url).pathname;
const pages = [];
const walk = (d) => readdirSync(d).forEach((f) => {
  const p = join(d, f);
  if (statSync(p).isDirectory()) { if (f !== "vendor" && f !== "skills") walk(p); }
  else if (p.endsWith(".html")) pages.push(p);
});
walk(dist);

const PROVIDERS = ["https://api.anthropic.com", "https://api.openai.com", "https://generativelanguage.googleapis.com"];
const CAPTCHA = ["https://web3forms.com", "https://js.hcaptcha.com", "https://*.hcaptcha.com"];
const TURNSTILE = "https://challenges.cloudflare.com";

// Links to other sites (LinkedIn, GitHub, ORCID, Google Scholar and the rest) open in a new tab.
// Done here so it covers every page, blog posts included, and works without JavaScript.
// A link to a file download, such as the release zip, stays in the same tab. Each one gets hidden text,
// "(opens in a new tab)", so a screen reader says so, as the NewTabLink component does.
const ownHosts = new Set(["dr-titus100.github.io", "titusnyarkonde.com", "www.titusnyarkonde.com"]);
try { ownHosts.add(new URL(process.env.SITE_URL || "https://dr-titus100.github.io").host); } catch {}
const NOTE = '<span class="sr-only"> (opens in a new tab)</span>';
const external = (html) => html.replace(/<a\b([^>]*?)\bhref="(https?:\/\/[^"]+)"([^>]*)>([\s\S]*?)<\/a>/g, (whole, before, href, after, inner) => {
  const attrs = before + after;
  if (/\btarget=/.test(attrs) || /\bdownload\b/.test(attrs) || /\.zip(?:$|[?#])/.test(href)) return whole;
  let host;
  try { host = new URL(href).host; } catch { return whole; }
  if (ownHosts.has(host)) return whole;
  const rel = /\brel="/.test(attrs) ? "" : ' rel="noopener noreferrer"';
  return `<a${before}href="${href}"${after} target="_blank"${rel}>${inner}${NOTE}</a>`;
});

let count = 0;
for (const file of pages) {
  let html = external(readFileSync(file, "utf8"));
  if (html.includes('http-equiv="Content-Security-Policy"')) continue;
  const hashes = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => `'sha256-${createHash("sha256").update(m[1], "utf8").digest("base64")}'`);
  const rewrite = html.includes('id="rw-config"');
  const contact = html.includes('id="contact-form"');
  // The comment form carries data-sitekey="" when Turnstile is off.
  const turnstile = /id="comment-form"[^>]*data-sitekey="[^"]+"/.test(html);
  const policy = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'wasm-unsafe-eval'", ...new Set(hashes), ...(contact ? CAPTCHA : []), ...(turnstile ? [TURNSTILE] : [])],
    "worker-src": ["'self'"],
    "connect-src": ["'self'", ...(rewrite ? PROVIDERS : []), ...(contact ? ["https://api.web3forms.com", "https://*.hcaptcha.com"] : [])],
    "frame-src": contact || turnstile ? [...(contact ? ["https://*.hcaptcha.com"] : []), ...(turnstile ? [TURNSTILE] : [])] : ["'none'"],
    "img-src": ["'self'", "data:"],
    "media-src": ["'self'"],
    "font-src": ["'self'"],
    "style-src": ["'self'", "'unsafe-inline'", ...(contact ? ["https://*.hcaptcha.com"] : [])],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'none'"],
  };
  const value = Object.entries(policy).map(([k, v]) => `${k} ${v.join(" ")}`).join("; ");
  const meta = `<meta http-equiv="Content-Security-Policy" content="${value}">`;
  // Right after <meta charset>, before any script, so the policy covers everything on the page.
  html = html.replace(/(<meta charset="[^"]*"\s*\/?>)/i, `$1${meta}`);
  if (!html.includes(meta)) throw new Error(`No <meta charset> to anchor the policy in ${file}`);
  html = html.replace(/<meta name="referrer"[^>]*>/, "");
  html = html.replace(meta, `${meta}<meta name="referrer" content="strict-origin-when-cross-origin">`);
  writeFileSync(file, html);
  count++;
}
console.log(`Content Security Policy added to ${count} pages.`);

// On Cloudflare (SITE_HOST=cloudflare), the host can send real headers from a _headers file.
// They add what a <meta> policy can't do: frame-ancestors, so no other site can show these pages
// inside a frame, plus nosniff, HSTS and a permissions policy. The <meta> policy above still sets
// which scripts and hosts each page may use. GitHub Pages would serve _headers as a plain file,
// so it is written only for Cloudflare builds.
if (process.env.SITE_HOST === "cloudflare") {
  const headers = `/*
  Content-Security-Policy: frame-ancestors 'none'; object-src 'none'; base-uri 'self'
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Strict-Transport-Security: max-age=31536000
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  Cross-Origin-Opener-Policy: same-origin

/_astro/*
  Cache-Control: public, max-age=31536000, immutable

/vendor/*
  Cache-Control: public, max-age=86400

/media/*
  Cache-Control: public, max-age=604800
`;
  writeFileSync(join(dist, "_headers"), headers);
  console.log("Security headers written to _headers for Cloudflare.");
}

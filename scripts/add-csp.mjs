// Adds a Content Security Policy to every built page, as a <meta> tag at the top of <head>.
// GitHub Pages can't send custom headers, so the meta tag is the closest we can get. It can't carry
// frame-ancestors (headers only), so the Rewrite page also hides its key field when it is framed.
//
// Each inline <script> is allowed by its SHA-256 hash, so script-src never needs 'unsafe-inline'.
// Outside hosts are allowed only on the pages that use them: the AI providers on Rewrite, and
// Web3Forms and hCaptcha on pages with the contact form.
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

let count = 0;
for (const file of pages) {
  let html = readFileSync(file, "utf8");
  if (html.includes('http-equiv="Content-Security-Policy"')) continue;
  const hashes = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => `'sha256-${createHash("sha256").update(m[1], "utf8").digest("base64")}'`);
  const rewrite = html.includes('id="rw-config"');
  const contact = html.includes('id="contact-form"');
  const policy = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'wasm-unsafe-eval'", ...new Set(hashes), ...(contact ? CAPTCHA : [])],
    "worker-src": ["'self'"],
    "connect-src": ["'self'", ...(rewrite ? PROVIDERS : []), ...(contact ? ["https://api.web3forms.com", "https://*.hcaptcha.com"] : [])],
    "frame-src": contact ? ["https://*.hcaptcha.com"] : ["'none'"],
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

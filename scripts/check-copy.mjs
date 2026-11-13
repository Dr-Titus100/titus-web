// Fails the build if visible page text breaks the writing rules the site preaches:
// no em dashes and no semicolons in prose. Code blocks, scripts and styles are skipped.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const dist = new URL("../dist", import.meta.url).pathname;
const files = [];
const walk = (d) => readdirSync(d).forEach((f) => { const p = join(d, f); statSync(p).isDirectory() ? (f !== "vendor" && f !== "skills" && walk(p)) : p.endsWith(".html") && files.push(p); });
walk(dist);

// The "before" examples break the rules on purpose, and a quotation stays exactly as the person wrote it.
const examples = ["isn't just a tracker", "It's not just a budget request", "Elena stood", "In today's fast-paced",
  "isn't just a fix", "is crucial to note", "comprehensive onboarding guide", "didn't just meet expectations", "We are not just building software"];
let bad = 0;
for (const f of files) {
  const text = readFileSync(f, "utf8")
    .replace(/<(script|style|pre|code|template)[\s\S]*?<\/\1>/g, " ")
    .replace(/<[^>]+(data-before|data-spans)="[^"]*"[^>]*>/g, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&#39;|&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
  text.split("\n").forEach((line) => {
    if (examples.some((e) => line.includes(e))) return; // the "before" examples break the rules on purpose
    if (/—/.test(line) || /;\s/.test(line)) {
      console.log(`${f.replace(dist, "")}: ${line.trim().slice(0, 120)}`);
      bad++;
    }
  });
}
if (bad) { console.error(`${bad} line(s) use an em dash or a semicolon.`); process.exit(1); }
console.log(`Wording check passed on ${files.length} pages.`);

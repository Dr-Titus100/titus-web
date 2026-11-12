// Looks up each skill's latest release. If it's newer than the pinned tag, downloads the files,
// records their checksums in skills.config.json and prints the new tags.
// The skill-update workflow then opens a pull request, so every new version is reviewed before it deploys.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const path = join(root, "skills.config.json");
const config = JSON.parse(readFileSync(path, "utf8"));
const token = process.env.GITHUB_TOKEN || "";
const headers = { "User-Agent": "titus-web-update", Accept: "application/vnd.github+json", ...(token && { Authorization: `Bearer ${token}` }) };
const get = async (url) => { const r = await fetch(url, { headers }); if (!r.ok) throw new Error(`${r.status} for ${url}`); return r; };

const bumped = [];
for (const skill of config.skills) {
  const latest = (await (await get(`https://api.github.com/repos/${skill.repo}/releases/latest`)).json()).tag_name;
  if (latest === skill.ref) { console.log(`${skill.slug}: ${skill.ref} is the latest release`); continue; }
  for (const file of Object.values(skill.files)) {
    const body = Buffer.from(await (await get(`https://raw.githubusercontent.com/${skill.repo}/${latest}/${file.path}`)).arrayBuffer());
    file.sha256 = createHash("sha256").update(body).digest("hex");
  }
  bumped.push(`${skill.slug} ${skill.ref} to ${latest}`);
  skill.ref = latest;
}
if (bumped.length) {
  writeFileSync(path, JSON.stringify(config, null, 2) + "\n");
  console.log(`Updated: ${bumped.join(", ")}`);
}
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `summary=${bumped.join(", ")}\n`);

// Puts each skill's files in public/skills/<slug>/ before the site builds.
//
// Every skill is pinned in skills.config.json to one release tag, with a SHA-256 checksum for each file.
// The build downloads exactly that tag and stops if any file's checksum doesn't match, so a moved tag,
// a compromised release or a network problem can't change what the site serves.
// This script never runs the downloaded files. The "does the script work" check runs in a separate,
// read-only CI job (scripts/check-skills.mjs).
//
// A new release reaches the site only through a pull request that bumps the tag and checksums
// (scripts/update-skills.mjs, run by .github/workflows/skill-update.yml).
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const config = JSON.parse(readFileSync(join(root, "skills.config.json"), "utf8"));
const dataFile = join(root, "src/data/skills.generated.json");
export const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

async function download(url) {
  const res = await fetch(url, { headers: { "User-Agent": "titus-web-build" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function fetchSkill(skill) {
  const dir = join(root, "public/skills", skill.slug);
  mkdirSync(dir, { recursive: true });
  for (const [name, file] of Object.entries(skill.files)) {
    const dest = join(dir, name);
    // A file already on disk with the right checksum is reused, so offline builds work.
    if (existsSync(dest) && sha256(readFileSync(dest)) === file.sha256) continue;
    const body = await download(`https://raw.githubusercontent.com/${skill.repo}/${skill.ref}/${file.path}`);
    const got = sha256(body);
    if (got !== file.sha256) {
      throw new Error(`${skill.slug}/${name} at ${skill.ref} has checksum ${got}, but skills.config.json expects ${file.sha256}. Stopping the build.`);
    }
    writeFileSync(dest, body);
  }
  const tag = encodeURIComponent(skill.ref);
  return {
    name: skill.name,
    repo: skill.repo,
    version: skill.ref,
    releaseUrl: `https://github.com/${skill.repo}/releases/tag/${tag}`,
    zipUrl: `https://github.com/${skill.repo}/releases/download/${tag}/${skill.zipAsset}`,
    repoUrl: `https://github.com/${skill.repo}`,
  };
}

const out = {};
try {
  for (const skill of config.skills) {
    out[skill.slug] = await fetchSkill(skill);
    console.log(`${skill.slug} ${skill.ref}: checksums match`);
  }
} catch (err) {
  console.error(`Could not prepare skills: ${err.message}`);
  process.exit(1);
}
mkdirSync(join(root, "src/data"), { recursive: true });
writeFileSync(dataFile, JSON.stringify(out, null, 2) + "\n");

// Pulls each skill's files from its own repo, at its latest release, before the site builds.
// The site never keeps its own copy of a skill, so a new release reaches the site on the next build.
//
// Environment:
//   GITHUB_TOKEN   optional, raises the GitHub API rate limit (set automatically in GitHub Actions)
//   SKILL_REF      optional, a branch or tag to use for every skill instead of the latest release
//   ALLOW_STALE=1  optional, keep the files from the last fetch if GitHub can't be reached (local use)
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const config = JSON.parse(readFileSync(join(root, "skills.config.json"), "utf8"));
const dataFile = join(root, "src/data/skills.generated.json");
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
const headers = { "User-Agent": "titus-web-build", Accept: "application/vnd.github+json" };
if (token) headers.Authorization = `Bearer ${token}`;

async function get(url, asJson) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return asJson ? res.json() : res.text();
}

async function fetchSkill(skill) {
  let ref = process.env.SKILL_REF || "";
  let release = null;
  if (!ref) {
    release = await get(`https://api.github.com/repos/${skill.repo}/releases/latest`, true);
    ref = release.tag_name;
  }
  const dir = join(root, "public/skills", skill.slug);
  mkdirSync(dir, { recursive: true });
  for (const [name, path] of Object.entries(skill.files)) {
    const text = await get(`https://raw.githubusercontent.com/${skill.repo}/${ref}/${path}`);
    writeFileSync(join(dir, name), text);
  }
  if (skill.check) {
    // A broken release stops the build here, so it never reaches visitors.
    const sample = join(tmpdir(), "titus-web-sample.txt");
    writeFileSync(sample, "It is not just a tool — it is a game-changer that leverages robust synergy to unlock value for every team in the organization today, and it helps.\n");
    const [cmd, ...args] = skill.check.map((a) => a.replace("{dir}", dir).replace("{sample}", sample));
    execFileSync(cmd, args, { stdio: "inherit" });
  }
  const asset = release?.assets?.find((a) => a.name === skill.zipAsset);
  return {
    name: skill.name,
    repo: skill.repo,
    version: ref,
    releaseUrl: release ? release.html_url : `https://github.com/${skill.repo}/tree/${ref}`,
    zipUrl: asset ? asset.browser_download_url : `https://github.com/${skill.repo}/releases/latest`,
    repoUrl: `https://github.com/${skill.repo}`,
    fetchedAt: new Date().toISOString(),
  };
}

const out = {};
try {
  for (const skill of config.skills) {
    out[skill.slug] = await fetchSkill(skill);
    console.log(`fetched ${skill.slug} at ${out[skill.slug].version}`);
  }
} catch (err) {
  if (process.env.ALLOW_STALE === "1" && existsSync(dataFile)) {
    console.warn(`Could not fetch skills (${err.message}). Keeping the files from the last fetch.`);
    process.exit(0);
  }
  console.error(`Could not fetch skills: ${err.message}`);
  process.exit(1);
}
mkdirSync(join(root, "src/data"), { recursive: true });
writeFileSync(dataFile, JSON.stringify(out, null, 2) + "\n");

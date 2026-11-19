// Puts each game's files in public/games/<slug>/ before the site builds.
//
// Every game is pinned in games.config.json to one release tag, with a SHA-256 checksum for each file.
// The build downloads exactly those release files and stops if any checksum doesn't match, so a changed
// release or a network problem can't change what the site serves. A new game version reaches the site
// only through a pull request that changes the tag and the checksums (the release's SHA256SUMS file
// lists them).
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const config = JSON.parse(readFileSync(join(root, "games.config.json"), "utf8"));
const dataFile = join(root, "src/data/games.generated.json");
const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

async function download(url) {
  const res = await fetch(url, { headers: { "User-Agent": "titus-web-build" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function fetchGame(game) {
  const dir = join(root, "public/games", game.slug);
  mkdirSync(dir, { recursive: true });
  const tag = encodeURIComponent(game.tag);
  for (const [name, expected] of Object.entries(game.files)) {
    const dest = join(dir, name);
    // A file already on disk with the right checksum is reused, so offline builds work.
    if (existsSync(dest) && sha256(readFileSync(dest)) === expected) continue;
    const body = await download(`https://github.com/${game.repo}/releases/download/${tag}/${name}`);
    const got = sha256(body);
    if (got !== expected) {
      throw new Error(`${game.slug}/${name} at ${game.tag} has checksum ${got}, but games.config.json expects ${expected}. Stopping the build.`);
    }
    writeFileSync(dest, body);
  }
  return {
    name: game.name,
    repo: game.repo,
    version: game.tag,
    releaseUrl: `https://github.com/${game.repo}/releases/tag/${tag}`,
    repoUrl: `https://github.com/${game.repo}`,
  };
}

const out = {};
try {
  for (const game of config.games) {
    out[game.slug] = await fetchGame(game);
    console.log(`${game.slug} ${game.tag}: checksums match`);
  }
} catch (err) {
  console.error(`Could not prepare games: ${err.message}`);
  process.exit(1);
}
mkdirSync(join(root, "src/data"), { recursive: true });
writeFileSync(dataFile, JSON.stringify(out, null, 2) + "\n");

// Runs each skill's own check command (for titus-humanizer, the scoring script on a sample) to make
// sure the pinned files work. CI runs this in its own job, with read-only permissions and no access to
// the Pages deployment. It reads the files fetch-skills.mjs verified and never writes into public/.
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const config = JSON.parse(readFileSync(join(root, "skills.config.json"), "utf8"));
const work = mkdtempSync(join(tmpdir(), "skill-check-"));
const sample = join(work, "sample.txt");
writeFileSync(sample, "It is not just a tool, it is a game-changer that leverages robust synergy to unlock value for every team in the organization today, and it helps.\n");
for (const skill of config.skills) {
  if (!skill.check) continue;
  // Copy the files out first, so anything the check writes (such as __pycache__) stays out of public/.
  const dir = join(work, skill.slug);
  cpSync(join(root, "public/skills", skill.slug), dir, { recursive: true });
  const [cmd, ...args] = skill.check.map((a) => a.replace("{dir}", dir).replace("{sample}", sample));
  execFileSync(cmd, args, { stdio: "inherit" });
  console.log(`${skill.slug} ${skill.ref}: check passed`);
}

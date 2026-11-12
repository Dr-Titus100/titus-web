// Runs scripts/gen_examples.py with local Python. Pass --check to fail if the committed file is stale.
// The site build never runs this. It only reads the committed src/data/examples.generated.json.
import { execFileSync } from "node:child_process";
const script = new URL("./gen_examples.py", import.meta.url).pathname;
execFileSync("python3", ["-B", script, ...process.argv.slice(2)], { stdio: "inherit" });

// Copies the Pyodide runtime (Python compiled for the browser) into the site,
// so the checker runs titus_tools.py without loading anything from another server.
import { copyFileSync, mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const from = join(root, "node_modules/pyodide");
const to = join(root, "public/vendor/pyodide");
// Pyodide 314 ships its runtime as an ES module (pyodide.asm.mjs) and no longer runs in classic workers,
// so the checker's worker is a module worker that imports pyodide.mjs.
const files = ["pyodide.mjs", "pyodide.asm.mjs", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"];
rmSync(to, { recursive: true, force: true });
mkdirSync(to, { recursive: true });
for (const f of files) {
  copyFileSync(join(from, f), join(to, f));
}
// The checker shows download progress in megabytes, so record the size of the big files.
const big = ["pyodide.asm.wasm", "python_stdlib.zip", "pyodide.asm.mjs", "pyodide-lock.json"];
writeFileSync(join(to, "sizes.json"), JSON.stringify(Object.fromEntries(big.map((f) => [f, statSync(join(to, f)).size]))));
console.log("copied Pyodide runtime to public/vendor/pyodide");

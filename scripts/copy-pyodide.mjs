// Copies the Pyodide runtime (Python compiled for the browser) into the site,
// so the checker runs titus_tools.py without loading anything from another server.
import { copyFileSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const from = join(root, "node_modules/pyodide");
const to = join(root, "public/vendor/pyodide");
mkdirSync(to, { recursive: true });
for (const f of ["pyodide.js", "pyodide.mjs", "pyodide.asm.js", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"]) {
  copyFileSync(join(from, f), join(to, f));
}
// The checker shows download progress in megabytes, so record the size of the big files.
const big = ["pyodide.asm.wasm", "python_stdlib.zip", "pyodide.asm.js", "pyodide-lock.json"];
writeFileSync(join(to, "sizes.json"), JSON.stringify(Object.fromEntries(big.map((f) => [f, statSync(join(to, f)).size]))));
console.log("copied Pyodide runtime to public/vendor/pyodide");

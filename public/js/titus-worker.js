// Runs titus_tools.py, the same script the skill uses, inside the browser with Pyodide.
// Nothing the visitor types leaves this worker.
const base = self.location.pathname.replace(/js\/titus-worker\.js$/, "");
let py = null;


// Downloads the big runtime files first, counting bytes, so the page can show real progress.
// Pyodide then reads the same files from the browser's cache.
async function prefetch() {
  const dir = base + "vendor/pyodide/";
  let sizes = {};
  try { sizes = await (await fetch(dir + "sizes.json")).json(); } catch { return; }
  const total = Object.values(sizes).reduce((a, b) => a + b, 0);
  let loaded = 0;
  const report = () => self.postMessage({ type: "progress", loaded, total });
  report();
  await Promise.all(Object.keys(sizes).map(async (name) => {
    const res = await fetch(dir + name);
    if (!res.ok || !res.body) { loaded += sizes[name]; report(); return; }
    const reader = res.body.getReader();
    let got = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      got += value.length;
      // Compressed and uncompressed sizes can differ, so never count past the file's real size.
      const add = Math.min(value.length, Math.max(0, sizes[name] - (got - value.length)));
      loaded += add;
      report();
    }
    if (got < sizes[name]) { loaded += sizes[name] - got; report(); }
  }));
}

async function init() {
  self.postMessage({ type: "status", text: "Downloading Python" });
  await prefetch();
  self.postMessage({ type: "status", text: "Starting Python" });
  importScripts(base + "vendor/pyodide/pyodide.js");
  py = await self.loadPyodide({ indexURL: base + "vendor/pyodide/" });
  self.postMessage({ type: "status", text: "Loading titus_tools.py" });
  const res = await fetch(base + "skills/titus-humanizer/titus_tools.py");
  if (!res.ok) throw new Error("Could not load titus_tools.py");
  py.FS.mkdirTree("/home/pyodide");
  py.FS.writeFile("/home/pyodide/titus_tools.py", await res.text());
  const glue = await fetch(base + "js/titus_glue.py");
  if (!glue.ok) throw new Error("Could not load titus_glue.py");
  py.runPython(await glue.text());
  self.postMessage({ type: "ready" });
}

const ready = init().catch((err) => {
  self.postMessage({ type: "failed", text: String(err && err.message ? err.message : err) });
  throw err;
});

self.onmessage = async (ev) => {
  const { id, op, args } = ev.data;
  try {
    await ready;
    const fn = py.globals.get(op);
    const out = fn(...args);
    fn.destroy && fn.destroy();
    self.postMessage({ id, ok: true, value: JSON.parse(out) });
  } catch (err) {
    self.postMessage({ id, ok: false, error: String(err && err.message ? err.message : err) });
  }
};

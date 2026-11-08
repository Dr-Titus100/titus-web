// Runs titus_tools.py, the same script the skill uses, inside the browser with Pyodide.
// Nothing the visitor types leaves this worker.
const base = self.location.pathname.replace(/js\/titus-worker\.js$/, "");
let py = null;

const GLUE = String.raw`
import sys, json, re
sys.path.insert(0, "/home/pyodide")
import titus_tools as tt

def _protected(text):
    spans = [(m.start(), m.end()) for m in tt.PROTECTED.finditer(text)]
    return lambda i: any(a <= i < b for a, b in spans)

def _hidden_marks(text):
    # Mirrors the checks in tt._clean_prose so the page can show where each removed character was.
    # The counts the page reports come from tt.clean itself.
    is_protected = _protected(text)
    chars = list(text)
    marks = []
    for i, ch in enumerate(chars):
        if is_protected(i):
            continue
        cp = ord(ch)
        prev = chars[i - 1] if i else ""
        nxt = chars[i + 1] if i + 1 < len(chars) else ""
        name = None
        if cp in tt.ZERO_WIDTH:
            name = tt.ZERO_WIDTH[cp]
        elif cp in tt.JOINERS:
            keep = tt._is_emoji(prev) or tt._is_emoji(nxt) or tt.COMPLEX_SCRIPTS.match(prev or " ") or tt.COMPLEX_SCRIPTS.match(nxt or " ")
            if not keep:
                name = tt.JOINERS[cp]
        elif cp in tt.BIDI:
            name = "text-direction control"
        elif 0xE0000 <= cp <= 0xE007F:
            if not (tt._in_flag_tags(chars, i) or (cp == 0xE007F and i and 0xE0020 <= ord(prev) <= 0xE007E and tt._in_flag_tags(chars, i - 1))):
                name = "invisible tag character"
        elif 0xFE00 <= cp <= 0xFE0F or 0xE0100 <= cp <= 0xE01EF:
            if not tt._is_emoji(prev):
                name = "variation selector"
        elif 0xE000 <= cp <= 0xF8FF or 0xF0000 <= cp <= 0x10FFFD or 0xFDD0 <= cp <= 0xFDEF or (cp & 0xFFFE) == 0xFFFE:
            name = "private-use or non-character"
        elif cp in tt.SPACES:
            name = "unusual space"
        if name:
            marks.append({"start": i, "end": i + 1, "name": name, "cp": "U+%04X" % cp})
    for m in re.finditer(r"\w+", text):
        if is_protected(m.start()):
            continue
        w = m.group(0)
        latin = sum(c.isascii() and c.isalpha() for c in w)
        fake = sum(c in tt.HOMOGLYPHS for c in w)
        if fake and latin and latin + fake == sum(c.isalpha() for c in w):
            for j, c in enumerate(w):
                if c in tt.HOMOGLYPHS:
                    marks.append({"start": m.start() + j, "end": m.start() + j + 1, "name": "look-alike letter", "cp": "U+%04X" % ord(c), "looks": tt.HOMOGLYPHS[c]})
    return sorted(marks, key=lambda x: x["start"])

def _pattern_spans(text):
    # The same regexes and filters tt.score counts, with code blanked out so positions line up.
    body = re.sub(r"\x60{3}.*?\x60{3}|\x60[^\x60]*\x60", lambda m: " " * len(m.group(0)), text, flags=re.S)
    spans = []
    for label, rx, w in tt.COMPILED:
        keep = tt.FILTERS.get(label, lambda b, m: True)
        for m in rx.finditer(body):
            if m.end() <= m.start() or not keep(body, m):
                continue
            seg = text[m.start():m.end()]
            lead = len(seg) - len(seg.lstrip(" .!?\n\t"))
            trail = len(seg) - len(seg.rstrip(" \n\t"))
            s, e = m.start() + lead, m.end() - trail
            if e > s:
                spans.append({"start": s, "end": e, "label": label, "weight": w})
    return spans

def _score_dict(r):
    r = dict(r)
    r["patterns"] = [{"label": l, "count": c, "sample": s} for l, c, s in r["patterns"]]
    return r

def analyze(text):
    cleaned, found = tt.clean(text)
    return json.dumps({
        "cleaned": cleaned,
        "found": dict(found.most_common()),
        "found_text": tt.describe_found(found),
        "hidden": _hidden_marks(text),
        "score": _score_dict(tt.score(cleaned)),
        "spans": _pattern_spans(cleaned),
        "min_words": tt.MIN_WORDS,
    })

def compare(original, rewrite):
    text, clean_new = tt.report(original, rewrite)
    clean_orig, _ = tt.clean(original)
    return json.dumps({
        "report": text,
        "cleaned_rewrite": clean_new,
        "before": _score_dict(tt.score(clean_orig)),
        "after": _score_dict(tt.score(clean_new)),
        "spans_after": _pattern_spans(clean_new),
    })
`;

async function init() {
  self.postMessage({ type: "status", text: "Loading Python" });
  importScripts(base + "vendor/pyodide/pyodide.js");
  py = await self.loadPyodide({ indexURL: base + "vendor/pyodide/" });
  self.postMessage({ type: "status", text: "Loading titus_tools.py" });
  const res = await fetch(base + "skills/titus-humanizer/titus_tools.py");
  if (!res.ok) throw new Error("Could not load titus_tools.py");
  py.FS.mkdirTree("/home/pyodide");
  py.FS.writeFile("/home/pyodide/titus_tools.py", await res.text());
  py.runPython(GLUE);
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

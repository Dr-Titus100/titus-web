// Talks to the worker that runs titus_tools.py in the browser.
export interface LoadState { started: boolean; ready: boolean; failed: boolean; text: string; loaded: number; total: number }
type Listener = (state: LoadState) => void;

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, { resolve: (v: any) => void; reject: (e: Error) => void }>();
const listeners = new Set<Listener>();
let state: LoadState = { started: false, ready: false, failed: false, text: "Not loaded", loaded: 0, total: 0 };

function start() {
  if (worker) return worker;
  const base = import.meta.env.BASE_URL.replace(/\/?$/, "/");
  worker = new Worker(base + "js/titus-worker.js", { type: "module" });
  state = { ...state, started: true, text: "Downloading Python" };
  listeners.forEach((l) => l(state));
  worker.onmessage = (ev) => {
    const m = ev.data;
    if (m.type === "status") state = { ...state, text: m.text };
    else if (m.type === "progress") state = { ...state, loaded: m.loaded, total: m.total };
    else if (m.type === "ready") state = { ...state, ready: true, failed: false, text: "Ready" };
    else if (m.type === "failed") state = { ...state, ready: false, failed: true, text: m.text };
    else if (m.id) {
      const p = pending.get(m.id);
      pending.delete(m.id);
      if (p) m.ok ? p.resolve(m.value) : p.reject(new Error(m.error));
      return;
    }
    listeners.forEach((l) => l(state));
  };
  // A worker that can't load at all, such as a module worker on an old browser, never posts "failed".
  worker.onerror = (ev) => {
    ev.preventDefault();
    if (state.failed) return;
    state = { ...state, ready: false, failed: true, text: "Python couldn't start in this browser" };
    pending.forEach((p) => p.reject(new Error(state.text)));
    pending.clear();
    listeners.forEach((l) => l(state));
  };
  return worker;
}

// Listens for loading progress. Nothing downloads until load() or a check starts the worker.
export function onStatus(l: Listener) {
  listeners.add(l);
  l(state);
}

// Starts downloading Python and the scoring script, about 14 MB the first time.
export function load() { start(); }

function call<T>(op: string, ...args: string[]): Promise<T> {
  const w = start();
  const id = ++seq;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    w.postMessage({ id, op, args });
  });
}

export interface Span { start: number; end: number; label: string; weight: number }
export interface Mark { start: number; end: number; name: string; cp: string; looks?: string }
export interface Score {
  words: number; sentences: number; status: string; score: number | null; tier: string;
  patterns: { label: string; count: number; sample: string }[];
  density?: number; sentence_cv?: number | null; mattr?: number; dampened?: boolean;
}
export interface Analysis { cleaned: string; found: Record<string, number>; found_text: string; hidden: Mark[]; score: Score; spans: Span[]; quotes: { start: number; end: number }[]; skipped: string | null; min_words: number }
export interface Comparison { report: string; cleaned_rewrite: string; before: Score; after: Score; spans_after: Span[] }

export const analyze = (text: string) => call<Analysis>("analyze", text);
export const compare = (original: string, rewrite: string) => call<Comparison>("compare", original, rewrite);

// Groups for coloring highlights. Labels the list doesn't know fall back to "tone".
const GROUPS: Record<string, string> = {
  "em dash": "rule", "dash used as a break": "rule", "semicolon": "rule", "arrow, bar or inline dot": "rule",
  "reject-then-assert": "rule", "not only / not just ... but": "rule", "rather than contrast": "rule",
  "passive voice (heuristic)": "rule", "slogan fragment": "rule", "illustrative hedging": "rule", "chatbot residue": "rule",
  "AI vocabulary": "vocab", "stock opener": "vocab", "sentence-initial connector": "vocab",
  "bold-label bullet": "format",
  "stated lesson": "story", "emotion as body sensation": "story", "setting as mirror": "story",
  "decorative smell": "story", "tidy inner resolution": "story",
  "quoted text": "quote",
};
export const groupOf = (label: string) => GROUPS[label] || "tone";
export const GROUP_NAMES: Record<string, string> = {
  rule: "Hard rule", tone: "Substance and tone", vocab: "Vocabulary", format: "Formatting", story: "Story pattern",
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

// Python reports offsets in code points, and JavaScript strings index UTF-16 units.
// Slicing an array of code points keeps the two in line when the text has emoji.
const codePoints = (text: string) => Array.from(text);

// Turns text plus overlapping spans into HTML with <mark> tags.
export function highlight(text: string, spans: Span[]) {
  const cps = codePoints(text);
  const cut = (a: number, b: number) => cps.slice(a, b).join("");
  const cuts = new Set<number>([0, cps.length]);
  spans.forEach((s) => { cuts.add(s.start); cuts.add(s.end); });
  const points = [...cuts].sort((a, b) => a - b);
  let html = "";
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    const piece = esc(cut(a, b));
    const covering = spans.filter((s) => s.start <= a && s.end >= b);
    if (!covering.length) { html += piece; continue; }
    covering.sort((x, y) => (x.end - x.start) - (y.end - y.start));
    // The shortest span on top owns this piece. data-span ties every piece of that span together,
    // so the page can outline the whole matched text when one piece is hovered or clicked.
    const top = covering[0];
    const id = spans.indexOf(top);
    html += `<mark class="hl hl-${groupOf(top.label)}" data-span="${id}" data-label="${esc(top.label)}" tabindex="0" role="button">${piece}</mark>`;
  }
  return html;
}

// Shows the original text with a visible badge where each hidden character sits.
export function showHidden(text: string, marks: Mark[]) {
  const cps = codePoints(text);
  const cut = (a: number, b?: number) => cps.slice(a, b).join("");
  let html = "", last = 0;
  for (const m of marks) {
    html += esc(cut(last, m.start));
    const ch = cut(m.start, m.end);
    const tip = `${m.name} (${m.cp})${m.looks ? `, looks like "${m.looks}"` : ""}`;
    html += m.name === "look-alike letter"
      ? `<mark class="hid hid-letter" data-label="${esc(tip)}" tabindex="0" role="button">${esc(ch)}</mark>`
      : `<mark class="hid" data-label="${esc(tip)}" tabindex="0" role="button">${esc(m.cp)}</mark>${ch === "\n" ? "\n" : ""}`;
    last = m.end;
  }
  return html + esc(cut(last));
}

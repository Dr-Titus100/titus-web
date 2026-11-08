// Animates a ScoreRing to a score from 0 to 1, or shows that the text was too short.
export function setRing(id: string, score: number | null, tier: string, note?: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const fill = el.querySelector<SVGCircleElement>(".ring-fill")!;
  const value = el.querySelector<HTMLElement>(".ring-value")!;
  const label = el.querySelector<HTMLElement>(".ring-tier")!;
  el.dataset.tier = score === null ? "none" : tier;
  fill.style.strokeDashoffset = String(100 - Math.round((score ?? 0) * 100));
  label.textContent = note ?? (score === null ? "Not scored" : `${tier[0].toUpperCase()}${tier.slice(1)}`);
  if (score === null) { value.textContent = "--"; return; }
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const from = parseFloat(value.textContent || "0") || 0;
  const t0 = performance.now();
  const dur = reduce ? 1 : 1100;
  const step = (t: number) => {
    const p = Math.min(1, (t - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    value.textContent = (from + (score - from) * e).toFixed(2);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

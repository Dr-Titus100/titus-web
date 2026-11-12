// Shared behavior for every page: sticky nav, mobile menu, headline and scroll animations, copy buttons.
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function toast(message: string) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  window.clearTimeout((el as any)._t);
  (el as any)._t = window.setTimeout(() => el.classList.remove("show"), 1800);
}

export async function copyText(text: string, label = "Copied") {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
  toast(label);
}

function splitHeadlines() {
  document.querySelectorAll<HTMLElement>("[data-rise]").forEach((el) => {
    if (reduceMotion) return;
    const words = (el.textContent || "").trim().split(/\s+/);
    el.textContent = "";
    el.classList.add("rise");
    words.forEach((w, i) => {
      const span = document.createElement("span");
      span.className = "w";
      span.style.animationDelay = `${0.08 * i + 0.1}s`;
      span.textContent = w;
      el.appendChild(span);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
  });
}

function revealOnScroll() {
  const items = document.querySelectorAll<HTMLElement>(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
  );
  items.forEach((el) => io.observe(el));
}

// Video and hero media grow into place as they scroll into view.
function scrollScale() {
  const frames = document.querySelectorAll<HTMLElement>("[data-scroll-scale]");
  if (!frames.length || reduceMotion) return;
  let ticking = false;
  const update = () => {
    const vh = window.innerHeight;
    frames.forEach((el) => {
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.85)));
      const scale = 0.86 + 0.14 * p;
      const tilt = 14 * (1 - p);
      el.style.transform = `rotateX(${tilt}deg) scale(${scale})`;
      el.style.opacity = String(0.4 + 0.6 * p);
    });
    ticking = false;
  };
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}

function nav() {
  const navEl = document.getElementById("nav");
  const toggle = navEl?.querySelector<HTMLButtonElement>(".nav-toggle");
  const onScroll = () => navEl?.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toggle?.addEventListener("click", () => {
    const open = !navEl!.classList.contains("open");
    navEl!.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });
}

function copyButtons() {
  document.addEventListener("click", async (ev) => {
    const btn = (ev.target as HTMLElement).closest<HTMLElement>("[data-copy], [data-copy-from], [data-copy-url]");
    if (!btn) return;
    if (btn.dataset.copy) return copyText(btn.dataset.copy);
    if (btn.dataset.copyFrom) {
      const src = document.querySelector<HTMLElement>(btn.dataset.copyFrom);
      if (src) return copyText((src as HTMLTextAreaElement).value ?? src.textContent ?? "");
    }
    if (btn.dataset.copyUrl) await copyFromUrl(btn.dataset.copyUrl, (t) => t, btn.dataset.copyLabel || "Copied");
  });
  // Load the files behind copy buttons as soon as the page opens. Safari only lets a page write to the
  // clipboard during the click itself, so the text has to be ready before the click, not fetched after it.
  document.querySelectorAll<HTMLElement>("[data-copy-url]").forEach((b) => { loadText(b.dataset.copyUrl!).catch(() => {}); });
}

const textCache = new Map<string, Promise<string>>();
const ready = new Map<string, string>();
// Fetches a text file once and keeps it. A failed or missing file rejects, so a 404 page is never copied.
export function loadText(url: string): Promise<string> {
  let p = textCache.get(url);
  if (!p) {
    p = fetch(url)
      .then((res) => { if (!res.ok) throw new Error(String(res.status)); return res.text(); })
      .then((t) => { ready.set(url, t); return t; });
    p.catch(() => textCache.delete(url));
    textCache.set(url, p);
  }
  return p;
}

// Copies text built from a fetched file. If the file is already loaded, the copy happens inside the click.
// If not, Safari still accepts a ClipboardItem that waits for the file.
export async function copyFromUrl(url: string, build: (text: string) => string, label: string) {
  const fail = () => toast("Couldn't load the rulebook. Try again.");
  const cached = ready.get(url);
  if (cached !== undefined) return copyText(build(cached), label);
  const pending = loadText(url).then(build);
  if ("ClipboardItem" in window && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([new ClipboardItem({ "text/plain": pending.then((t) => new Blob([t], { type: "text/plain" })) })]);
      toast(label);
      return;
    } catch {
      // Fall through: the file failed, or this browser refused the delayed write.
    }
  }
  try { await copyText(await pending, label); } catch { fail(); }
}

export function initSite() {
  nav();
  splitHeadlines();
  revealOnScroll();
  scrollScale();
  copyButtons();
}

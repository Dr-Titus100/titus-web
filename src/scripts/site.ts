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

// The phone menu: a full-screen panel. While it's open, the page behind it can't scroll or take focus,
// Tab cycles inside the menu, and Escape, a link or a switch to the desktop layout closes it.
function nav() {
  const navEl = document.getElementById("nav");
  const toggle = navEl?.querySelector<HTMLButtonElement>(".nav-toggle");
  const list = document.getElementById("nav-links");
  const onScroll = () => navEl?.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (!navEl || !toggle || !list) return;
  const phone = window.matchMedia("(max-width: 760px)");
  const behind = () => [...document.body.children].filter((el) => el !== navEl && !el.contains(navEl) && el.tagName !== "SCRIPT") as HTMLElement[];
  const links = () => [...list.querySelectorAll<HTMLAnchorElement>("a")];

  function setOpen(open: boolean, restoreFocus = true) {
    navEl!.classList.toggle("open", open);
    document.documentElement.classList.toggle("menu-open", open);
    toggle!.setAttribute("aria-expanded", String(open));
    toggle!.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    behind().forEach((el) => { el.inert = open; });
    if (open) links()[0]?.focus();
    else if (restoreFocus) toggle!.focus();
  }
  toggle.addEventListener("click", () => setOpen(!navEl.classList.contains("open")));
  list.addEventListener("click", (e) => { if ((e.target as HTMLElement).closest("a") && navEl.classList.contains("open")) setOpen(false, false); });
  document.addEventListener("keydown", (e) => {
    if (!navEl.classList.contains("open")) return;
    if (e.key === "Escape") { e.preventDefault(); setOpen(false); return; }
    if (e.key !== "Tab") return;
    const items = [toggle, ...links()];
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  phone.addEventListener("change", () => { if (!phone.matches && navEl.classList.contains("open")) setOpen(false, false); });
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
    if (btn.dataset.copyUrl) {
      btn.setAttribute("disabled", "");
      try {
        const res = await fetch(btn.dataset.copyUrl);
        await copyText(await res.text(), btn.dataset.copyLabel || "Copied");
      } finally {
        btn.removeAttribute("disabled");
      }
    }
  });
}

// Links that leave this site open in a new tab, so visitors keep their place here.
function externalLinksInNewTab() {
  const mark = (a: HTMLAnchorElement) => {
    if (!/^https?:$/.test(a.protocol) || a.host === location.host) return;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  };
  document.querySelectorAll<HTMLAnchorElement>("a[href]").forEach(mark);
  // Catch links added after load, such as ones written into results.
  document.addEventListener("click", (e) => {
    const a = (e.target as Element | null)?.closest?.("a[href]");
    if (a) mark(a as HTMLAnchorElement);
  }, true);
}

export function initSite() {
  externalLinksInNewTab();
  nav();
  splitHeadlines();
  revealOnScroll();
  scrollScale();
  copyButtons();
}

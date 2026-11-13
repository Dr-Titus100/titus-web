// Shared behavior for every page: sticky nav, phone menus, footer columns, scroll reveal and copy buttons.
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

// The phone menu: a full-screen panel. While it's open, the page behind it can't scroll or take focus,
// Tab cycles inside the menu, and Escape, a link or a switch to the desktop layout closes it.
function nav() {
  const navEl = document.getElementById("nav");
  const toggle = navEl?.querySelector<HTMLButtonElement>(".nav-toggle");
  const list = document.getElementById("nav-links");
  if (!navEl || !toggle || !list) return;
  const phone = window.matchMedia("(max-width: 734px)");
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

// On phones, pages with a product bar hide the global nav while you scroll down and bring it back
// when you scroll up, so only the 52 px product bar stays on screen.
function navAway() {
  if (!document.querySelector(".subnav")) return;
  const phone = window.matchMedia("(max-width: 734px)");
  const root = document.documentElement;
  let last = window.scrollY;
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    if (!phone.matches || root.classList.contains("menu-open")) { root.classList.remove("nav-away"); last = y; return; }
    if (Math.abs(y - last) < 6) return;
    root.classList.toggle("nav-away", y > last && y > 120);
    last = y;
  }, { passive: true });
}

// The product bar's section menu on phones: the chevron opens and closes it, and Escape or a
// click outside closes it.
function productBar() {
  const bar = document.querySelector<HTMLElement>(".subnav");
  const toggle = bar?.querySelector<HTMLButtonElement>(".subnav-toggle");
  if (!bar || !toggle) return;
  const setOpen = (open: boolean) => {
    bar.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close the titus-humanizer menu" : "Open the titus-humanizer menu");
  };
  toggle.addEventListener("click", () => setOpen(!bar.classList.contains("open")));
  document.addEventListener("click", (e) => { if (bar.classList.contains("open") && !bar.contains(e.target as Node)) setOpen(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && bar.classList.contains("open")) { setOpen(false); toggle.focus(); } });
}

// The footer's site-map columns are open on wide screens and fold into a list of headings on phones.
function footerColumns() {
  const cols = [...document.querySelectorAll<HTMLDetailsElement>(".footer-col")];
  if (!cols.length) return;
  const phone = window.matchMedia("(max-width: 734px)");
  const apply = () => cols.forEach((d) => { d.open = !phone.matches; });
  apply();
  phone.addEventListener("change", apply);
}

export function initSite() {
  nav();
  navAway();
  productBar();
  footerColumns();
  revealOnScroll();
  copyButtons();
}

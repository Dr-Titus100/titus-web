// One tabs pattern for every tab set on the site (the Checker views, the Any chatbot guides and
// the Install platforms). It follows the WAI-ARIA tabs pattern: only the selected tab is in the
// Tab order, the arrow keys move between tabs, Home and End jump to the first and last, and
// moving to a tab selects it.

export interface Tabs {
  select(tab: HTMLButtonElement, focus?: boolean): void;
  tabs: HTMLButtonElement[];
}

export function initTabs(list: HTMLElement, onSelect: (tab: HTMLButtonElement) => void): Tabs {
  const tabs = [...list.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const vertical = list.getAttribute("aria-orientation") === "vertical";

  function select(tab: HTMLButtonElement, focus = false) {
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    }
    if (focus) tab.focus();
    onSelect(tab);
  }

  tabs.forEach((tab, i) => {
    tab.type = "button";
    tab.tabIndex = tab.getAttribute("aria-selected") === "true" ? 0 : -1;
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", (e) => {
      const next = vertical ? "ArrowDown" : "ArrowRight";
      const prev = vertical ? "ArrowUp" : "ArrowLeft";
      let j = -1;
      if (e.key === next) j = (i + 1) % tabs.length;
      else if (e.key === prev) j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") j = 0;
      else if (e.key === "End") j = tabs.length - 1;
      if (j < 0) return;
      e.preventDefault();
      select(tabs[j], true);
    });
  });
  if (!tabs.some((t) => t.tabIndex === 0) && tabs[0]) tabs[0].tabIndex = 0;
  return { select, tabs };
}

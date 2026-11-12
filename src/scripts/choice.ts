// A row of buttons where exactly one is chosen, such as the Experience page's role filter.
// The chosen button has aria-pressed="true". Each button stays in the Tab order, since these are
// plain toggle buttons rather than tabs. For tab sets, use initTabs in tabs.ts.

export function initChoice(group: HTMLElement, onSelect: (button: HTMLButtonElement) => void) {
  const buttons = [...group.querySelectorAll<HTMLButtonElement>("button[aria-pressed]")];
  function select(button: HTMLButtonElement) {
    for (const b of buttons) b.setAttribute("aria-pressed", String(b === button));
    onSelect(button);
  }
  buttons.forEach((b) => b.addEventListener("click", () => select(b)));
  return { select, buttons };
}

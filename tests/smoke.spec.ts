import { test, expect, type Page } from "@playwright/test";

// Every page on the site. Add new pages here.
const pages = [
  "",
  "about/",
  "experience/",
  "tools/",
  "blog/",
  "blog/the-exercise-book/",
  "tools/titus-humanizer/",
  "tools/titus-humanizer/checker/",
  "tools/titus-humanizer/rewrite/",
  "tools/titus-humanizer/any-chatbot/",
  "tools/titus-humanizer/install/",
  "privacy/",
  "terms/",
  "site-map/",
];

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

for (const path of pages) {
  test(`/${path} loads with one h1 and no errors`, async ({ page }) => {
    const errors = collectErrors(page);
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await page.waitForTimeout(300);
    expect(errors).toEqual([]);
  });

  test(`/${path} has no sideways scrolling or overlapping controls`, async ({ page }) => {
    await page.goto(path);
    // Show content that normally fades in on scroll, so every control has its final position.
    await page.evaluate(() => document.querySelectorAll(".reveal").forEach((e) => e.classList.add("in")));
    await page.waitForTimeout(300);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "page is wider than the screen").toBeLessThanOrEqual(0);
    const overlaps = await page.evaluate(() => {
      const visible = (el: Element) => {
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return s.visibility !== "hidden" && s.display !== "none" && r.width > 0 && r.height > 0 && !el.closest("[hidden], [inert]");
      };
      const controls = [...document.querySelectorAll("main button, main .btn, main [role=tab], main input:not([type=hidden]), main select, main textarea")].filter(visible);
      const found: string[] = [];
      for (let i = 0; i < controls.length; i++) {
        for (let j = i + 1; j < controls.length; j++) {
          const a = controls[i], b = controls[j];
          if (a.contains(b) || b.contains(a)) continue;
          const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
          const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
          const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
          if (w > 2 && h > 2) found.push(`${a.textContent?.trim() || a.id} overlaps ${b.textContent?.trim() || b.id}`);
        }
      }
      return found;
    });
    expect(overlaps).toEqual([]);
  });
}

test("the Checker scores the sample text", async ({ page }) => {
  test.setTimeout(180_000);
  const errors = collectErrors(page);
  await page.goto("tools/titus-humanizer/checker/");
  await page.click("#sample");
  await expect(page.locator("#results")).toBeVisible({ timeout: 150_000 });
  await expect(page.locator("#ring")).toContainText(/0\.\d\d/);
  await expect(page.locator("#patterns li")).not.toHaveCount(0);
  await expect(page.locator("#view mark.hl").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("Rewrite switches provider and remembers the choice", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("tools/titus-humanizer/rewrite/");
  await page.click('#providers [data-p="anthropic"]');
  await expect(page.locator('#providers [data-p="anthropic"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('#providers [data-p="gemini"]')).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("#prov-name")).toHaveText("Anthropic Claude");
  await page.reload();
  await expect(page.locator('#providers [data-p="anthropic"]')).toHaveAttribute("aria-pressed", "true");
  expect(errors).toEqual([]);
});

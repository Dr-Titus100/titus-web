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
  "admin/comments/",
];

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

// The comments API lives in the Cloudflare Worker, which `astro preview` doesn't run. Blog posts built
// with SITE_HOST=cloudflare ask it for comments, so every test gets an empty answer here.
test.beforeEach(async ({ page }) => {
  await page.route(/\/api\/comments\?/, (route) => route.fulfill({ contentType: "application/json", body: '{"comments":[]}' }));
  // A stand-in for Cloudflare Turnstile, so the comment form's spam check passes at once without the network.
  await page.route(/challenges\.cloudflare\.com\/turnstile\/v0\/api\.js/, (route) => route.fulfill({ contentType: "text/javascript", body: `
    (() => {
      let done = () => {};
      window.turnstile = {
        render(_el, opts) { done = () => opts.callback("test-token"); done(); return "w1"; },
        reset() { done(); },
      };
      const onload = new URL(document.currentScript.src).searchParams.get("onload");
      if (onload) window[onload]();
    })();` }));
});

// The comment form loads the spam check when someone clicks into it. Wait until it has a token.
async function passCheck(page: Page) {
  await page.waitForFunction(() => "turnstile" in window);
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

// The comments section is built only for Cloudflare (SITE_HOST=cloudflare), where the Worker answers
// /api/comments. Here the API is faked. To run this test, build with SITE_HOST=cloudflare first.
test("blog comments list approved comments and replies, and post both", async ({ page }) => {
  const errors = collectErrors(page);
  const posted: any[] = [];
  await page.route(/\/api\/comments(\?.*)?$/, async (route) => {
    const req = route.request();
    if (req.method() === "POST") {
      posted.push(req.postDataJSON());
      return route.fulfill({ status: 202, contentType: "application/json", body: JSON.stringify({ status: "pending" }) });
    }
    expect(new URL(req.url()).searchParams.get("post")).toBe("the-exercise-book");
    return route.fulfill({ contentType: "application/json", body: JSON.stringify({ total: 1, count: 2, comments: [
      { id: 1, name: "Ama", body: "Loved it.\nThe <b>fish stall</b> part most.", created: "2026-11-12T10:00:00.000Z", parent: null, author: false },
      { id: 2, name: "Titus Nyarko Nde", body: "Thank you, Ama.", created: "2026-11-12T11:00:00.000Z", parent: 1, author: true },
    ] }) });
  });
  await page.goto("blog/the-exercise-book/");
  test.skip((await page.locator("#comments").count()) === 0, "built without SITE_HOST=cloudflare, so there's no comments section");
  await expect(page.locator("#cm-list > .cm-item")).toHaveCount(1);
  await expect(page.locator("#cm-count")).toHaveText(" (2)");
  // Comment text shows as plain text, never as HTML.
  await expect(page.locator(".cm-body").first()).toContainText("<b>fish stall</b>");
  await expect(page.locator(".cm-body b")).toHaveCount(0);
  // The reply sits under its comment with the Author label.
  const reply = page.locator("#comment-1 .cm-replies .cm-item");
  await expect(reply).toHaveCount(1);
  await expect(reply.locator(".cm-badge")).toHaveText("Author");
  await expect(page.locator("#comment-1 > .cm-meta .cm-badge")).toHaveCount(0);

  await expect(page.locator("#cm-body")).toHaveAttribute("maxlength", "3000");
  await page.click("#cm-send");
  await expect(page.locator("#cm-form-status")).toHaveText("Please add your name and a comment.");
  await page.fill("#cm-name", "Kofi");
  await page.fill("#cm-body", "Great story.");
  await passCheck(page);
  await page.click("#cm-send");
  await expect(page.locator("#cm-form-status")).toContainText("Your comment will show up here after I read it");
  await expect(page.locator("#cm-body")).toHaveValue("");

  // Reply to the author's reply. It joins the thread, and the form goes back to a comment afterward.
  await reply.getByRole("button", { name: "Reply to Titus Nyarko Nde" }).click();
  await expect(page.locator("#cm-replying")).toBeVisible();
  await expect(page.locator("#cm-replying-name")).toHaveText("Titus Nyarko Nde");
  await expect(page.locator("#cm-send")).toHaveText("Post reply");
  await page.fill("#cm-name", "Esi");
  await page.fill("#cm-body", "Same here.");
  await page.click("#cm-send");
  await expect(page.locator("#cm-form-status")).toContainText("Your reply will show up here after I read it");
  await expect(page.locator("#cm-replying")).toBeHidden();
  await expect(page.locator("#cm-send")).toHaveText("Post comment");
  expect(posted).toEqual([
    { post: "the-exercise-book", name: "Kofi", body: "Great story.", trap: false, token: "test-token" },
    { post: "the-exercise-book", name: "Esi", body: "Same here.", trap: false, token: "test-token", parent: 2 },
  ]);
  expect(errors).toEqual([]);
});

// With the spam check on, the Worker answers 201 with the saved comment, and the page shows it at once.
test("a comment that passes the spam check shows at once", async ({ page }) => {
  const errors = collectErrors(page);
  let next = 10;
  await page.route(/\/api\/comments(\?.*)?$/, async (route) => {
    const req = route.request();
    if (req.method() === "POST") {
      const sent = req.postDataJSON();
      const comment = { id: next++, name: sent.name, body: sent.body, created: "2026-11-13T12:00:00.000Z", parent: sent.parent ?? null, author: false };
      return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ status: "approved", comment }) });
    }
    return route.fulfill({ contentType: "application/json", body: JSON.stringify({ total: 1, count: 1, comments: [
      { id: 1, name: "Ama", body: "Loved it.", created: "2026-11-12T10:00:00.000Z", parent: null, author: false },
    ] }) });
  });
  await page.goto("blog/the-exercise-book/");
  test.skip((await page.locator("#comments").count()) === 0, "built without SITE_HOST=cloudflare, so there's no comments section");
  await expect(page.locator("#cm-list > .cm-item")).toHaveCount(1);
  await page.fill("#cm-name", "Kofi");
  await page.fill("#cm-body", "Great story.");
  await passCheck(page);
  await page.click("#cm-send");
  await expect(page.locator("#cm-form-status")).toHaveText("Thanks. Your comment is up.");
  await expect(page.locator("#cm-list > .cm-item")).toHaveCount(2);
  await expect(page.locator("#comment-10 > .cm-body")).toHaveText("Great story.");
  await expect(page.locator("#cm-count")).toHaveText(" (2)");

  await page.locator("#comment-1 > .cm-reply-btn").click();
  await page.fill("#cm-name", "Esi");
  await page.fill("#cm-body", "Same here.");
  await page.click("#cm-send");
  await expect(page.locator("#cm-form-status")).toHaveText("Thanks. Your reply is up.");
  await expect(page.locator("#comment-1 .cm-replies #comment-11")).toContainText("Same here.");
  await expect(page.locator("#cm-list > .cm-item")).toHaveCount(2);
  await expect(page.locator("#cm-count")).toHaveText(" (3)");
  expect(errors).toEqual([]);
});

// If the first load is slow and a reader posts before it finishes, the new comment must stay in the list.
test("a comment posted before the list loads stays in the list", async ({ page }) => {
  const errors = collectErrors(page);
  let posted!: () => void;
  const postDone = new Promise<void>((resolve) => { posted = resolve; });
  await page.route(/\/api\/comments(\?.*)?$/, async (route) => {
    const req = route.request();
    if (req.method() === "POST") {
      const sent = req.postDataJSON();
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ status: "approved",
        comment: { id: 10, name: sent.name, body: sent.body, created: "2026-11-13T12:00:00.000Z", parent: null, author: false } }) });
      posted();
      return;
    }
    await postDone;
    await new Promise((r) => setTimeout(r, 100));
    return route.fulfill({ contentType: "application/json", body: JSON.stringify({ total: 1, count: 1, comments: [
      { id: 1, name: "Ama", body: "Loved it.", created: "2026-11-12T10:00:00.000Z", parent: null, author: false },
    ] }) });
  });
  await page.goto("blog/the-exercise-book/");
  test.skip((await page.locator("#comments").count()) === 0, "built without SITE_HOST=cloudflare, so there's no comments section");
  await page.fill("#cm-name", "Kofi");
  await page.fill("#cm-body", "Great story.");
  await passCheck(page);
  await page.click("#cm-send");
  await expect(page.locator("#cm-form-status")).toHaveText("Thanks. Your comment is up.");
  await expect(page.locator("#comment-1")).toBeVisible();
  await expect(page.locator("#cm-list > .cm-item")).toHaveCount(2);
  await expect(page.locator("#comment-10 > .cm-body")).toHaveText("Great story.");
  await expect(page.locator("#cm-count")).toHaveText(" (2)");
  expect(errors).toEqual([]);
});

test("the moderation page lists comments and approves one", async ({ page }) => {
  const errors = collectErrors(page);
  const rows = [
    { id: 2, post: "the-exercise-book", name: "Kofi", body: "Great story.", status: "pending", created: "2026-11-13T09:00:00.000Z", parent: 1, parentName: "Ama", author: false },
    { id: 1, post: "the-exercise-book", name: "Ama", body: "Loved it.", status: "approved", created: "2026-11-12T10:00:00.000Z", parent: null, parentName: null, author: false },
  ];
  const actions: any[] = [];
  await page.route(/\/api\/comments\/admin$/, async (route) => {
    const req = route.request();
    if (req.headers()["authorization"] !== "Bearer right-token") {
      return route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: "token" }) });
    }
    if (req.method() === "POST") {
      const body = req.postDataJSON();
      actions.push(body);
      if (body.action === "approve") rows.find((r) => r.id === body.id)!.status = "approved";
      if (body.action === "reply") rows.unshift({ id: 3, post: "the-exercise-book", name: "Titus Nyarko Nde", body: body.body, status: "approved", created: "2026-11-13T10:00:00.000Z", parent: 1, parentName: "Ama", author: true });
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true }) });
    }
    return route.fulfill({ contentType: "application/json", body: JSON.stringify({ comments: rows }) });
  });
  await page.goto("admin/comments/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  await page.fill("#mod-token", "wrong-token");
  await page.click("#mod-login button[type=submit]");
  await expect(page.locator("#mod-status")).toHaveText("That token doesn't match the one on the Worker.");
  await expect(page.locator("#mod-lists")).toBeHidden();
  await page.fill("#mod-token", "right-token");
  await page.click("#mod-login button[type=submit]");
  await expect(page.locator("#mod-pending .mod-item")).toHaveCount(1);
  await expect(page.locator("#mod-pending .mod-meta")).toContainText("replying to Ama");
  await expect(page.locator("#mod-approved .mod-item")).toHaveCount(1);
  await page.locator("#mod-pending .mod-item").getByRole("button", { name: "Approve", exact: true }).click();
  await expect(page.locator("#mod-status")).toHaveText("Approved.");
  await expect(page.locator("#mod-approved .mod-item")).toHaveCount(2);
  await expect(page.locator("#mod-pending-empty")).toBeVisible();
  // Reply to Ama. The reply shows at once with the Author label, and it has no Reply button of its own.
  await page.locator("#mod-approved .mod-item", { hasText: "Loved it." }).getByRole("button", { name: "Reply", exact: true }).click();
  await expect(page.locator("#mod-reply-1")).toHaveAttribute("maxlength", "3000");
  await page.fill("#mod-reply-1", "Thank you, Ama.");
  await page.getByRole("button", { name: "Post reply" }).click();
  await expect(page.locator("#mod-status")).toHaveText("Reply posted.");
  const mine = page.locator("#mod-approved .mod-item", { hasText: "Thank you, Ama." });
  await expect(mine.locator(".mod-badge")).toHaveText("Author");
  await expect(mine.getByRole("button", { name: "Reply", exact: true })).toHaveCount(0);
  expect(actions).toEqual([{ action: "approve", id: 2 }, { action: "reply", id: 1, body: "Thank you, Ama." }]);
  // The browser logs the 401 answer to the wrong token. Nothing else should show up.
  expect(errors.filter((e) => !e.includes("401"))).toEqual([]);
});

import { readFileSync } from "node:fs";
import { test, expect, type Page } from "@playwright/test";

// Every page on the site. Add new pages here.
const pages = [
  "",
  "about/",
  "experience/",
  "tools/",
  "blog/",
  "blog/the-exercise-book/",
  "blog/titus-humanizer-release/",
  "blog/ai-fiction-gives-itself-away/",
  "tools/titus-humanizer/",
  "tools/titus-humanizer/checker/",
  "tools/titus-humanizer/rewrite/",
  "tools/titus-humanizer/any-chatbot/",
  "tools/titus-humanizer/install/",
  "games/sankofa-snake/",
  "games/sankofa-snake/play/",
  "games/sankofa-snake/how-to-play/",
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
test("the blog list filters posts by tag and keeps the tag in the address", async ({ page }) => {
  await page.goto("blog/");
  const rows = page.locator(".post-row");
  const total = await rows.count();
  await page.getByRole("tab", { name: "Research", exact: true }).click();
  await expect(page).toHaveURL(/\?tag=research$/);
  await expect(rows.filter({ visible: true })).toHaveCount(2);
  await expect(rows.filter({ visible: true })).toContainText(["What 31 years of rain records", "AI fiction gives itself away"]);
  await page.getByRole("tab", { name: "All", exact: true }).click();
  await expect(page).not.toHaveURL(/tag=/);
  await expect(rows.filter({ visible: true })).toHaveCount(total);
  // A tag on a post opens the list already filtered.
  await page.goto("blog/titus-humanizer-release/");
  await page.locator(".eyebrow a.post-tag", { hasText: "Release" }).click();
  await expect(page.getByRole("tab", { name: "Release", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(rows.filter({ visible: true })).toHaveCount(2);
});

test("each home page blog card ends with a Read the post link", async ({ page }) => {
  await page.goto("");
  const cards = page.locator(".home-tile[href*='/blog/'] .link-arrow", { hasText: "Read the post" });
  await expect(cards).toHaveCount(3);
});

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
      if (body.action === "comment") rows.unshift({ id: 4, post: body.post, name: "Titus Nyarko Nde", body: body.body, status: "approved", created: "2026-11-13T11:00:00.000Z", parent: null, parentName: null, author: true });
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
  // Forget the token is a pill like Show comments.
  await expect(page.locator("#mod-forget")).toHaveClass("btn");
  await expect(page.locator("#mod-forget")).toHaveCSS("border-radius", await page.locator("#mod-login button[type=submit]").evaluate((b) => getComputedStyle(b).borderRadius));
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
  // Start a comment of your own. It shows at once with the Author label.
  await expect(page.locator("#mod-new-body")).toHaveAttribute("maxlength", "3000");
  await page.getByRole("button", { name: "Post comment" }).click();
  await expect(page.locator("#mod-new-body")).toBeFocused();
  await page.selectOption("#mod-new-post", "the-exercise-book");
  await page.fill("#mod-new-body", "Thanks for reading, everyone.");
  await page.getByRole("button", { name: "Post comment" }).click();
  await expect(page.locator("#mod-status")).toHaveText("Comment posted.");
  await expect(page.locator("#mod-new-body")).toHaveValue("");
  const own = page.locator("#mod-approved .mod-item", { hasText: "Thanks for reading, everyone." });
  await expect(own.locator(".mod-badge")).toHaveText("Author");
  expect(actions).toEqual([
    { action: "approve", id: 2 },
    { action: "reply", id: 1, body: "Thank you, Ama." },
    { action: "comment", post: "the-exercise-book", body: "Thanks for reading, everyone." },
  ]);
  // The browser logs the 401 answer to the wrong token. Nothing else should show up.
  expect(errors.filter((e) => !e.includes("401"))).toEqual([]);
});

test("Sankofa Snake starts, runs and pauses", async ({ page, isMobile }) => {
  const errors = collectErrors(page);
  await page.goto("games/sankofa-snake/play/?seed=1");
  const game = page.locator("[data-sankofa-snake]");
  await expect(game.getByRole("heading", { name: "Sankofa Snake", level: 2 })).toBeVisible();
  await game.getByRole("button", { name: "Play", exact: true }).click();
  const overlay = game.locator("[data-overlay]");
  // Phones are told to press an arrow button or swipe, computers to press a key.
  await expect(overlay.getByText(isMobile ? "Press an arrow or swipe to start." : "Press an arrow key to start.")).toBeVisible();
  await page.keyboard.press("ArrowUp");
  await expect(overlay).toBeHidden();
  await page.keyboard.press("p");
  await expect(overlay.getByText("Paused", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("Sankofa Snake has its own menu item and the Tools card opens it", async ({ page, isMobile }) => {
  await page.goto("tools/");
  // A click on the card's screenshot, away from the buttons, opens the game page. The title's link
  // covers the card, so it takes the click (force skips the check that the image itself is on top).
  await page.locator(".tool-feature", { hasText: "Sankofa Snake" }).locator(".tool-shot img").click({ force: true });
  await expect(page).toHaveURL(/\/games\/sankofa-snake\/$/);
  if (isMobile) await page.getByRole("button", { name: "Open menu" }).click();
  const nav = page.getByRole("navigation", { name: "Site", exact: true });
  const item = nav.getByRole("link", { name: "Sankofa Snake" });
  await expect(item).toHaveAttribute("aria-current", "page");
  const labels = await nav.locator(".nav-links a").allTextContents();
  expect(labels.indexOf("Sankofa Snake")).toBe(labels.indexOf("Humanizer") + 1);
  expect(labels.indexOf("Blog")).toBe(labels.indexOf("Sankofa Snake") + 1);
});

test("Sankofa Snake has About, Play game and How to play tabs", async ({ page, isMobile }) => {
  const errors = collectErrors(page);
  await page.goto("games/sankofa-snake/");
  const tabs = page.getByRole("navigation", { name: "Sankofa Snake" });
  // On a phone the tabs fold into a menu button.
  const open = async () => { if (isMobile) await page.getByRole("button", { name: "Open the Sankofa Snake menu" }).click(); };
  await expect(tabs.locator(".subnav-links a")).toHaveText(["About the game", "Play game", "How to play"]);
  await expect(tabs.locator(".subnav-links a", { hasText: "About the game" })).toHaveAttribute("aria-current", "page");
  await expect(page.locator("[data-sankofa-snake]")).toHaveCount(0);

  // The Play game tab has the three buttons and leaves How to play to its own tab.
  await open();
  await tabs.getByRole("link", { name: "Play game" }).click();
  await expect(page).toHaveURL(/\/games\/sankofa-snake\/play\/$/);
  const game = page.locator("[data-sankofa-snake]");
  for (const name of ["Play", "Daily challenge", "Choose a level"]) {
    await expect(game.getByRole("button", { name, exact: true })).toBeVisible();
  }
  await expect(game.getByRole("button", { name: "How to play" })).toHaveCount(0);

  // The How to play tab shows the rules and the switches, with no Back or Play button.
  await open();
  await tabs.getByRole("link", { name: "How to play" }).click();
  await expect(page).toHaveURL(/\/games\/sankofa-snake\/how-to-play\/$/);
  const help = page.locator("[data-sankofa-snake]");
  await expect(help.getByText("Eat 20 cowrie shells to clear a level")).toBeVisible();
  await expect(help.getByRole("button", { name: "Sound", exact: true })).toBeVisible();
  await expect(help.getByRole("button", { name: "Back" })).toHaveCount(0);
  await expect(help.getByRole("button", { name: "Play", exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});

// Like the blog comments test, this needs a build with SITE_HOST=cloudflare, and fakes /api/comments.
test("Sankofa Snake reviews show ratings, sort, and post a review and a reply", async ({ page }) => {
  const errors = collectErrors(page);
  const posted: any[] = [];
  let next = 20;
  await page.route(/\/api\/comments(\?.*)?$/, async (route) => {
    const req = route.request();
    if (req.method() === "POST") {
      const sent = req.postDataJSON();
      posted.push(sent);
      const comment = { id: next++, name: sent.name, body: sent.body, created: "2026-11-19T12:00:00.000Z", parent: sent.parent ?? null, author: false, rating: sent.rating ?? null, favorite: sent.favorite ?? null };
      return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ status: "approved", comment }) });
    }
    expect(new URL(req.url()).searchParams.get("post")).toBe("games/sankofa-snake");
    return route.fulfill({ contentType: "application/json", body: JSON.stringify({
      total: 2, count: 3,
      ratings: { count: 2, average: 7, counts: [0, 0, 0, 1, 0, 0, 0, 0, 0, 1] },
      comments: [
        { id: 1, name: "Ama", body: "The Ocean level is hard.", created: "2026-11-15T10:00:00.000Z", parent: null, author: false, rating: 4, favorite: "ocean" },
        { id: 2, name: "Kwame", body: "", created: "2026-11-16T10:00:00.000Z", parent: null, author: false, rating: 10, favorite: null },
        { id: 3, name: "Titus Nyarko Nde", body: "Try Practice first.", created: "2026-11-16T11:00:00.000Z", parent: 1, author: true, rating: null, favorite: null },
      ],
    }) });
  });
  await page.goto("games/sankofa-snake/play/");
  test.skip((await page.locator("#reviews").count()) === 0, "built without SITE_HOST=cloudflare, so there's no reviews section");
  const reviews = page.locator("#reviews");
  await expect(reviews.getByRole("heading", { name: /Community reviews/ })).toBeVisible();
  await expect(reviews.locator(".rv-intro")).toHaveText("Ratings and reviews from players on this website.");
  await expect(reviews.locator("#cm-agree")).toContainText("you agree to the posting rules and confirm you're 13 or older");
  await expect(reviews.locator("#cm-agree a")).toHaveAttribute("href", /\/terms\/#posting-rules$/);
  await expect(page.locator("#rv-average")).toHaveText("7.0");
  await expect(page.locator("#rv-total")).toHaveText("From 2 ratings");
  await expect(page.locator("#rv-bars li")).toHaveCount(10);
  await expect(page.locator("#rv-bars li").first()).toHaveAttribute("aria-label", "10 out of 10: 1 rating");
  await expect(page.locator("#review-1 .rv-score")).toHaveAttribute("aria-label", "Rated 4 out of 10");
  await expect(page.locator("#review-1 .rv-fav")).toHaveText("Favorite: Level 8, Ocean");
  await expect(page.locator("#review-1 .cm-replies .cm-badge")).toHaveText("Author");

  // Newest first, then by rating either way.
  const tops = page.locator("#cm-list > .cm-item > .cm-meta strong");
  await expect(tops).toHaveText(["Kwame", "Ama"]);
  await page.getByRole("button", { name: "Lowest rated" }).click();
  await expect(tops).toHaveText(["Ama", "Kwame"]);
  await expect(page.getByRole("button", { name: "Lowest rated" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Highest rated" }).click();
  await expect(tops).toHaveText(["Kwame", "Ama"]);

  // A review needs a rating. The text is optional.
  await page.fill("#cm-name", "Esi");
  await page.click("#cm-send");
  await expect(page.locator("#cm-form-status")).toHaveText("Please pick a rating from 1 to 10.");
  await page.locator("#rv-rating label", { hasText: /^8$/ }).click();
  await page.selectOption("#rv-favorite-level", "daily");
  await page.fill("#cm-body", "The daily challenge is fun.");
  await passCheck(page);
  await page.click("#cm-send");
  await expect(page.locator("#cm-form-status")).toHaveText("Thanks. Your review is up.");
  await expect(page.locator("#rv-total")).toHaveText("From 3 ratings");
  await expect(page.locator("#rv-average")).toHaveText("7.3");
  await expect(page.locator("#review-20 .rv-score")).toHaveAttribute("aria-label", "Rated 8 out of 10");

  // A reply to someone else's review has no rating, and needs text.
  await page.locator("#review-2").getByRole("button", { name: "Reply to Kwame" }).first().click();
  await expect(page.locator("#rv-rating")).toBeHidden();
  await expect(page.locator("#rv-favorite")).toBeHidden();
  await expect(page.locator("#cm-send")).toHaveText("Post reply");
  await page.fill("#cm-name", "Yaw");
  await page.click("#cm-send");
  await expect(page.locator("#cm-form-status")).toHaveText("Please add your name and a reply.");
  await page.fill("#cm-body", "Agreed, the Village is the best.");
  await page.click("#cm-send");
  await expect(page.locator("#review-2 .cm-replies .cm-item")).toHaveCount(1);
  await expect(page.locator("#rv-total")).toHaveText("From 3 ratings");
  await expect(page.locator("#rv-rating")).toBeVisible();
  expect(posted).toEqual([
    { post: "games/sankofa-snake", name: "Esi", body: "The daily challenge is fun.", trap: false, token: "test-token", rating: 8, favorite: "daily" },
    { post: "games/sankofa-snake", name: "Yaw", body: "Agreed, the Village is the best.", trap: false, token: "test-token", parent: 2 },
  ]);
  expect(errors).toEqual([]);
});

// Like the reviews test, this needs a build with SITE_HOST=cloudflare. It fakes /api/comments and the report API.
test("readers can report a review or a reply, but not the author's notes", async ({ page }) => {
  const errors = collectErrors(page);
  const reports: any[] = [];
  await page.route(/\/api\/comments(\?.*)?$/, (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({
    total: 1, count: 3,
    ratings: { count: 1, average: 4, counts: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0] },
    comments: [
      { id: 1, name: "Ama", body: "Buy cheap shoes here.", created: "2026-11-15T10:00:00.000Z", parent: null, author: false, rating: 4 },
      { id: 2, name: "Kofi", body: "Call me at home.", created: "2026-11-15T11:00:00.000Z", parent: 1, author: false },
      { id: 3, name: "Titus Nyarko Nde", body: "Thanks.", created: "2026-11-16T11:00:00.000Z", parent: 1, author: true },
    ],
  }) }));
  // The first report waits until the test lets it through, to open another form while it's sending.
  let release = () => {};
  const held = new Promise<void>((r) => { release = r; });
  await page.route(/\/api\/comments\/report$/, async (route) => {
    const sent = route.request().postDataJSON();
    reports.push(sent);
    if (sent.id === 1) await held;
    if (sent.id === 2) return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "missing" }) });
    return route.fulfill({ status: 202, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
  await page.goto("games/sankofa-snake/play/");
  test.skip((await page.locator("#reviews").count()) === 0, "built without SITE_HOST=cloudflare, so there's no reviews section");
  await expect(page.locator("#review-1 > .cm-report-btn")).toBeVisible();
  // The author's note has no Report link.
  await expect(page.locator("#review-3 .cm-report-btn")).toHaveCount(0);

  const report = page.getByRole("button", { name: "Report Ama's review" });
  await report.click();
  await expect(report).toHaveAttribute("aria-expanded", "true");
  const box = page.locator("#review-1 > .cm-report");
  await expect(box.getByRole("radio")).toHaveCount(4);
  await box.getByRole("button", { name: "Send report" }).click();
  await expect(box.locator(".cm-report-status")).toHaveText("Please pick a reason.");
  await box.getByLabel("Spam or advertising").check();
  await box.getByRole("button", { name: "Send report" }).click();
  await expect(box.locator(".cm-report-status")).toHaveText("Sending...");
  // Open another report while the first is sending. The first one finishing must leave it open.
  await page.getByRole("button", { name: "Report Kofi's reply" }).click();
  const second = page.locator("#review-2 > .cm-report");
  await second.getByLabel("Shares someone's personal information").check();
  release();
  await expect(page.locator("#review-1 > .cm-done")).toHaveText("Thanks for the report. I'll take a look.");
  await expect(page.getByRole("button", { name: "Report Ama's review" })).toHaveCount(0);
  await expect(second).toBeVisible();
  await expect(second.getByLabel("Shares someone's personal information")).toBeChecked();

  // A reply that's gone says so, and the form stays open.
  await second.getByRole("button", { name: "Send report" }).click();
  await expect(second.locator(".cm-report-status")).toHaveText("This reply isn't on the site anymore.");
  await second.getByRole("button", { name: "Cancel" }).click();
  await expect(second).toHaveCount(0);
  expect(reports).toEqual([{ id: 1, reason: "spam" }, { id: 2, reason: "personal" }]);
  // The browser logs the 404 answer. Nothing else should show up.
  expect(errors.filter((e) => !e.includes("404"))).toEqual([]);
});

test("the moderation page lists reported comments, and Keep it clears the reports", async ({ page }) => {
  const errors = collectErrors(page);
  const rows: any[] = [
    { id: 1, post: "games/sankofa-snake", name: "Ama", body: "Buy cheap shoes here.", status: "approved", created: "2026-11-15T10:00:00.000Z", parent: null, parentName: null, author: false, rating: 4, reports: { spam: 2, other: 1 } },
    { id: 2, post: "the-exercise-book", name: "Kofi", body: "Nice.", status: "approved", created: "2026-11-14T10:00:00.000Z", parent: null, parentName: null, author: false },
  ];
  const actions: any[] = [];
  await page.route(/\/api\/comments\/admin$/, async (route) => {
    const req = route.request();
    if (req.method() === "POST") {
      const body = req.postDataJSON();
      actions.push(body);
      if (body.action === "dismiss") delete rows.find((r) => r.id === body.id).reports;
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true }) });
    }
    return route.fulfill({ contentType: "application/json", body: JSON.stringify({ comments: rows }) });
  });
  await page.goto("admin/comments/");
  await page.fill("#mod-token", "right-token");
  await page.click("#mod-login button[type=submit]");
  const reported = page.locator("#mod-reported .mod-item");
  await expect(reported).toHaveCount(1);
  await expect(page.locator("#mod-reported-count")).toHaveText("(1)");
  await expect(reported.locator(".mod-flag")).toHaveText("Reported 3 times: spam or advertising (2), something else (1)");
  // It still shows in its usual list, with the flag.
  await expect(page.locator("#mod-approved .mod-item .mod-flag")).toHaveCount(1);
  await reported.getByRole("button", { name: "Keep it" }).click();
  await expect(page.locator("#mod-status")).toHaveText("Kept, and its reports are cleared.");
  await expect(page.locator("#mod-reported-empty")).toBeVisible();
  await expect(page.locator(".mod-flag")).toHaveCount(0);
  expect(actions).toEqual([{ action: "dismiss", id: 1 }]);
  expect(errors).toEqual([]);
});

test("the game pages have their own link preview image", async ({ page }) => {
  for (const path of ["games/sankofa-snake/", "games/sankofa-snake/play/", "games/sankofa-snake/how-to-play/"]) {
    await page.goto(path);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/og\/sankofa-snake\.png$/);
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute("content", /Sankofa bird logo/);
  }
  const res = await page.request.get("og/sankofa-snake.png");
  expect(res.status()).toBe(200);
});

test("the game pages load the game with its version in the address, so a new release reaches every browser", async ({ page }) => {
  const games = JSON.parse(readFileSync(new URL("../src/data/games.generated.json", import.meta.url), "utf8"));
  const version = games["sankofa-snake"].version.replace(/^v/, "").replace(/\./g, "\\.");
  for (const path of ["games/sankofa-snake/play/", "games/sankofa-snake/how-to-play/"]) {
    await page.goto(path);
    await expect(page.locator('script[src*="sankofa-snake.js"]')).toHaveAttribute("src", new RegExp(`sankofa-snake\\.js\\?v=${version}$`));
    await expect(page.locator('link[href*="sankofa-snake.css"]')).toHaveAttribute("href", new RegExp(`sankofa-snake\\.css\\?v=${version}$`));
  }
});

test("each part of the site has its own footer note, and only the Humanizer pages mention the Checker", async ({ page }) => {
  const notes: [string, RegExp, RegExp | null][] = [
    ["tools/titus-humanizer/", /The Checker runs in your browser/, /\/privacy\/$/],
    ["tools/titus-humanizer/checker/", /The Checker runs in your browser/, /\/privacy\/$/],
    ["games/sankofa-snake/", /Sankofa Snake runs in your browser/, /\/privacy\/#sankofa-snake$/],
    ["games/sankofa-snake/play/", /Sankofa Snake runs in your browser/, /\/privacy\/#sankofa-snake$/],
    ["games/sankofa-snake/how-to-play/", /Sankofa Snake runs in your browser/, /\/privacy\/#sankofa-snake$/],
    ["blog/", /Comments are saved on this site|no analytics/, /\/privacy\/(#comments)?$/],
    ["about/", /contact form go through Web3Forms/, /\/privacy\/$/],
    ["privacy/", /ask me through the contact form/, null],
    ["terms/", /These terms cover the tools/, /\/privacy\/$/],
    ["", /no analytics or tracking/, /\/privacy\/$/],
    ["tools/", /no analytics or tracking/, /\/privacy\/$/],
    ["experience/", /no analytics or tracking/, /\/privacy\/$/],
  ];
  for (const [path, text, privacy] of notes) {
    await page.goto(path);
    const note = page.locator(".footer-note");
    await expect(note, path).toContainText(text);
    if (!path.startsWith("tools/titus-humanizer/")) await expect(note, path).not.toContainText("Checker");
    if (privacy) await expect(note.locator('a[href*="/privacy/"]'), path).toHaveAttribute("href", privacy);
    else await expect(note.locator('a[href*="/privacy/"]'), path).toHaveCount(0);
  }
});

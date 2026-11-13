# Changelog

Notable changes to the titus-web site, newest first. The site has no version numbers, so entries are grouped by date.

## 2026-11-13

- Every button is an outlined pill with a thin blue ring and blue text, and it fills blue when you hover over or focus it. None starts filled. That covers the Home, About, Experience and Tools pages, the Checker (Check text, Try a sample, Clear, Copy cleaned text, Rewrite with your key, Use any chatbot), Rewrite (Show key, Rewrite), Any chatbot (Copy prompt, Open the Checker), Install (Download, release notes, Copy), the overview (Check your text, Watch the tour, Install) and "Read the transcript". On Any chatbot, Copy full rulebook is a text link like the Download link next to it.
- The home page buttons are About, Experience, Contact me and See my work, which opens the Tools page. "What you'll find here" and "From the blog", with its All posts button, are back from the earlier layout, on the current card colors. My photo on Home and About has its blue ring again.
- Links to other sites, such as LinkedIn, GitHub, ORCID and Google Scholar, open in a new tab and tell screen readers so. The profile links on Experience are blue.
- The GitHub profile links in the footer, on About and on Experience open my list of repositories (`github.com/Dr-Titus100?tab=repositories`).
- The tour video is the new version with captions in the picture. The separate captions track is gone so lines don't show twice. The transcript still comes from the WebVTT file.
- The titus-humanizer section is named Humanizer in the top navigation, the product bar and the footer. The product bar's "Try it free" button is gone.
- The chosen button in the Experience filter and the Any chatbot assistant tabs stands out in dark mode. The Experience filter works like the Checker's tabs, with arrow keys, and All is chosen first. Gemini is chosen first on Any chatbot.
- On Experience, "Show earlier roles" folds the roles away again with "Show fewer roles", and the talks list switches between "See all 17" and "Show less".
- In the Checker, after you click a highlight, the arrow keys move to the next or previous one. Tab and Shift+Tab still work. The note under the text explains both. The "first check downloads Python" line is gone from the status area.
- The overview and Install pages have five more before-and-after examples, with code, a file path, a link, emoji and a quotation. Each report has a "Left as-is" line, added by the site's glue, that counts what came through unchanged. Rewrite reports get the same line. The Rewrite card on the overview says code snippets, file paths, links, emojis and quoted text are left as-is.
- New wording: the score note says a lower score means plainer, better writing, and explains that titus-humanizer doesn't target AI watermarks but helps to reduce them. The Terms page matches. "The 12 setup steps", "You don't need Claude or ChatGPT to use it" and "Turned my AI-trainer experience" on Experience. On Rewrite, the provider button says ChatGPT and the key card says OpenAI ChatGPT.

- The site lives at https://titusnyarkonde.com, served by Cloudflare, with www.titusnyarkonde.com as a second address. The old github.io address forwards to it.
- The site is ready to move to its own domain on Cloudflare. `wrangler.jsonc` sets up hosting and preview links for pull requests. A Cloudflare build writes real security headers, names Cloudflare on the Privacy page and offers Remember my key. A repository variable, `NEW_SITE_URL`, switches GitHub Pages to forwarding pages that send every old address to the same page on the new domain. Nothing changes until the domain is set up.
- The Privacy page explains why Remember my key is off on github.io more precisely. Only the sites I publish under `dr-titus100.github.io` share storage with this one. Sites under other github.io names don't.
- The Checker runs on Pyodide 314.0.7 with Python 3.14, up from Pyodide 0.29.5 with Python 3.13. Pyodide now runs only in module workers, so the Checker's worker loads as a module and imports `pyodide.mjs`. If the worker can't load at all, the status line says Python couldn't load instead of waiting forever. The first download is about 14 MB, up from about 12 MB, and the scores are the same as before.
- The tour video has English captions, and a "Read the transcript" panel under it shows the narration by scene.
- New layout across the site, built from the approved mockups. Inter in one type scale (80 px page names, 56 px section titles, 40 px tile titles, 17 px body, smaller on phones), an 8 px spacing grid, and sections that alternate white and light gray. Dark mode uses a black page, #1d1d1f sections and #2c2c2e cards with thin borders.
- The top navigation is 44 px tall with a TN monogram, and the current page shows in full-strength text. On phones it hides while you scroll down a titus-humanizer page and comes back when you scroll up.
- The titus-humanizer bar is 52 px tall with a "Try it free" button that opens the Checker. On phones its pages fold into a menu behind a chevron.
- Each section has one filled button. Other actions are text links that end in ›.
- The footer is a site map with four columns (titus-humanizer, Work and writing, About Titus, Elsewhere) that fold into headings on phones, and a bottom row with the copyright, Privacy, Terms and a new Site map page.
- Nothing starts hidden or animates forever. Sections slide a few pixels into place as you scroll and stay visible if scripts don't run. The gradient headline text and the scaling video are gone.
- The home page puts my photo beside my name, adds three facts (Ph.D., citations, titus-humanizer version) and shows a large picture of the Checker scoring a sample email.
- The Experience page shows the five most recent roles with one line each and a "Show details" control. Older roles and the full list of talks open on request.
- The tour video shows a sharp poster frame and a large play button, loads nothing until you press play, and lists its length and captions under it.
- The titus-humanizer overview uses line icons for the four ways to use it. Install labels each copy block (Repository link, Plugin commands, Manual install, Terminal).
- The Checker, Rewrite, Any chatbot and Install pages lost their inline styles and use shared classes instead.
- Links on the light blue notices and the green "Rewrite" label in the overview demo are a shade darker, so they pass WCAG AA contrast.

## 2026-11-12

- Wording that claimed more than the site can show is fixed. The score note on the Checker and the overview now says the score counts the AI-writing patterns titus-humanizer targets and doesn't measure quality. "Four ways to use it" drops "with no sign-up", since Rewrite needs a provider account. The Tools card on the home page says most tools have a free way to try them in your browser. "How it works" says three steps instead of three levels. The Experience stat says the churn model I built at KCB Bank Rwanda instead of a model the bank adopted.
- Blog posts show "By Titus Nyarko Nde", the date and the reading time under the title, and end with links to the older and newer posts and back to the blog. The Blog label and the date are on separate lines.
- On the Install page, the "Your assistant can install it" card comes right after the top of the page, then the steps for each assistant, then the video.
- The top navigation says titus-humanizer instead of Humanizer, matching the page names. The titus-humanizer pages' browser tab titles start with titus-humanizer, such as "titus-humanizer Checker". The Tools page puts "Skill" and the version on separate lines.
- Smoke tests: `npm test` runs Playwright against the built site on a desktop and a 375 px phone. It checks that every page loads with one `h1` and no console errors, has no sideways scrolling and no overlapping controls, that the Checker scores the sample text, and that the Rewrite provider picker remembers its choice. A new Tests workflow runs them on every push and pull request, along with the wording check and `gen-examples.mjs --check`.
- Code cleanup: the slide-up animation is defined once in `global.css`. The Experience filter and the Rewrite provider picker use a shared `initChoice` helper. The Experience role tags and the link color on dark sections use color tokens. The Checker's and Experience page's stats blocks have their own class names.
- Shared links show a picture. Each page has `og:image`, `og:url`, `og:site_name` and a large Twitter card. The home page uses a card with my photo and name, About uses a larger photo, the titus-humanizer pages use the Checker scoring the sample text, and each blog post gets a title card. `npm run share-images` remakes them.
- The site has `robots.txt` with a Sitemap line, `favicon.ico`, a 180 px Apple touch icon and a web manifest with 192 px and 512 px icons. `npm run icons` remakes the icons from `favicon.svg`.
- Search engines get structured data: `Person` on About, with LinkedIn, Google Scholar, ORCID and GitHub as `sameAs`, `SoftwareApplication` on the titus-humanizer overview, and `BlogPosting` on each post.
- The blog has an RSS feed at `/rss.xml`, linked from every page's head.
- Phones and small windows get a 720p copy of the tour video, about 3.7 MB instead of 8 MB. Wider screens still get the 1080p file.
- The site uses Inter on every system, served from the site itself with `font-display: swap`, so text shows right away in a fallback font and switches when Inter arrives. The main file is preloaded. Before, each system used its own font.
- The blurred, drifting color glow behind every page's headline is gone, and the spinning ring on the empty-state pages no longer spins. On phones, the titus-humanizer bar has a solid background, so only the top bar is blurred.
- A "Skip to content" link appears at the top of every page on the first press of Tab, and moves focus to the page's main content.
- The tabs on the Checker, Any chatbot and Install pages work like standard tabs. Only the selected tab is in the Tab order, the arrow keys move between tabs, and Home and End jump to the first and last. One shared script, `src/scripts/tabs.ts`, runs all three.
- After a check, screen readers hear a one-line summary, such as "Score 0.80, high. 11 pattern types found. 2 hidden characters removed." The Check text button is described by the status line next to it, so a screen reader also hears whether Python is ready.
- The footer column headings are `h2` elements inside a navigation landmark named "Site map", instead of `h4` elements with no heading above them.
- The tour video can show captions and a transcript. Adding `public/media/titus-humanizer-promo.en.vtt` turns on the captions track and a "Read the transcript" panel built from the same file.
- Color contrast passes WCAG AA in light and dark mode on every page: the Fiction tag, filled blue buttons in dark mode, links on dark tiles, hidden-character badges and the current page in the titus-humanizer bar. Links inside sentences are underlined, so they don't rely on color alone.
- The Install page's Claude steps match Claude's current menus: Customize, Skills, the + button, Create skill, Upload a skill. The Claude Code steps create `~/.claude/skills` before copying into it.
- The Checker downloads Python only when you click into the text box, type, or press a button, instead of as soon as the page opens. A progress bar shows the download in megabytes.
- Checker highlights can be reached with the keyboard. Tab moves between them and shows each pattern's name, Enter or Space keeps the label open and Escape closes it. Screen readers hear the name as the highlight's description.
- The overview demo and the before-and-after reports come from the pinned scoring script's own output, built by `scripts/gen-examples.mjs`, instead of labels typed by hand. A line under the demo explains why plain text rarely scores 0.
- The phone menu is a full-screen panel. Closed, its links can't be reached with Tab. Open, the page behind it doesn't scroll or take focus, focus moves to the first link, and Escape, a link or a wider window closes it and returns focus to the menu button.
- The Python glue the Checker runs moved from `titus-worker.js` into `public/js/titus_glue.py`, so the example generator can run the same code.
- New Privacy and Terms pages, linked from the footer, the contact form, the Checker and the Rewrite page.
- Rewrite keeps API keys in the page's memory by default, so a reload clears them. Remember my key saves a key for 30 days, and it's hidden while the site runs on github.io, where other project sites share the same origin. Keys that earlier versions saved are removed. A Forget my key button clears every saved key, and a Show key button reveals the masked field.
- Rewrite says exactly what goes to which provider, links each provider's data policy, notes that Google may use free-tier text, and warns that requests can be billed. The page hides its key field when another site shows it in a frame.
- Rewrite requests time out after two minutes and can be stopped. Errors now say what went wrong (a rejected key, a retired model, a rate limit, a provider outage or no connection) and never show the key.
- The suggested models moved to `src/data/providers.ts`, with the date they were last checked. OpenAI's gpt-5 and gpt-5-mini, which shut down on December 11, 2026, are replaced by gpt-5.6-sol and gpt-5.6-terra, and Gemini now suggests gemini-3.8-flash and gemini-3.5-flash-lite.
- Every page has a Content Security Policy, added at build time by `scripts/add-csp.mjs`. Inline scripts are allowed by hash, and outside hosts only on the pages that use them. Pages also send a strict-origin-when-cross-origin referrer policy.
- The footer's privacy line now matches what each part of the site does. The Checker note says your text stays in your browser and the site doesn't store or send it.
- The contact form says that Web3Forms delivers the message, adds Web3Forms' free hCaptcha check, gives up after 20 seconds and keeps your message when sending fails. The email address is built in the browser behind a Show my email address button, so bots can't read it from the page source.
- Links no longer open in new tabs site-wide. The provider key links on Rewrite still do, and they now show an icon and tell screen readers.
- The copy buttons on Any chatbot load the rulebook when the page opens, so copying works in Safari, and they show an error instead of copying a missing file.
- Skill files are pinned. `skills.config.json` names one release tag for each skill and a SHA-256 checksum for each file, and the build stops if a checksum doesn't match. The build no longer looks up the latest release, and it never runs the downloaded files. A separate read-only CI job runs the scoring script as a check.
- New releases now arrive as pull requests. The Propose skill updates workflow opens one when titus-humanizer publishes a release, and nothing deploys until it's merged. The nightly build and the rebuild on each release are gone.
- The build workflow is read-only by default. Only the deploy job, on `main`, gets the Pages permissions. Every action is pinned to a full commit SHA, and Dependabot proposes updates for actions and npm packages.

## 2026-11-10 (evening)

- On the Checker, hovering over a highlight shows the same label as a click, and both outline the exact text the pattern matched, across every line it covers.
- In the Checker's Patterns found card, the quoted-text and hidden-character lines are bold. The quoted-text line always shows, and says "Quoted text: none." when there are no quotations. The Try a sample text now includes a quotation, so the sample shows how quotes are left out.
- The privacy note under the Checker's text box no longer mentions the Python download. It now says your text stays on your device and that the website keeps no copies.
- On the Checker, clicking or tapping a highlight shows the pattern's name in a small label. Before, only hovering did. The same works for the hidden-character badges.
- On the Checker, Highlighted patterns is selected when the results appear and after each new check. The color key now shows only with Highlighted patterns.
- The Short version card on Any chatbot gives its word count as well as its character count.
- The Cleaned text tab and the Copy cleaned text button are back on the Checker and work as before. They show and copy the text with hidden characters removed. The Checker's wording says it removes hidden characters again, on the Checker and on the Overview card.
- The Checker leaves quoted text out, the same way the titus-humanizer script does. Patterns inside a quotation are no longer highlighted, quotations get a dashed underline, and the Patterns found list says how many quotations it left as written.
- The Checker no longer has the Cleaned text tab or the Copy cleaned text button, since it scores text and doesn't change it. Its hidden-character line now says "found" instead of "removed".
- "Rewrite with your key" on the Checker uses the outline style, like "Use any chatbot".
- On Any chatbot, the Full rulebook and Short version cards say that both keep quotations as written. Their word and character counts now come from the release files.
- On the Overview, the Rewrite card says quotations stay as they were, and the Check any text card says the Checker finds hidden characters and leaves quoted text out of the score.

## 2026-11-10 (later)

- In "The exercise book", the defense room is full of friends and classmates, with more friends, classmates and family watching online, and the talk runs about forty-five minutes.
- In "The exercise book", the Panthers soccer team is no longer called "not good". The story now says the team reached the second-division final and finished second.
- "The exercise book" now names Titus's mother, Akosua Yentumi. The note at the top says she is real and the events are made up. The README headings and wording also got a titus-humanizer pass.
- The blog has its first post, "The exercise book", a short story told in first person about a fish seller's sales book and a dissertation defense. It's fiction, and it says so at the top.
- Blog posts can set `fiction: true`. Those posts show a "Fiction" label on the blog list, on the home page and on the post itself.
- The README explains the fiction label and asks visitors to type their correct email in the contact form. This file is new too.

## 2026-11-10

- The home page is now a general overview of the site. It has a short intro, cards for Tools, Blog and Experience, the latest posts and a short About me section.
- All the titus-humanizer content moved to Humanizer > Overview, with no repeats. It covers the demo, the four ways to use it, the video, how it works, the rules and the before-and-after examples.
- "Checker" in the top menu is now "Humanizer". Its tabs are Overview, Checker, Rewrite, Any chatbot and Install. Overview opens first.
- Watch video, Try it free and Install buttons sit under the Overview intro. Watch video jumps to the video and highlights the button you clicked.
- Most buttons now use the outline style. On the Checker, Check text, Try a sample and Clear are all outlined, and the one you click fills in. The view tabs start unselected.
- The score note says a lower score means plainer, better writing.
- The Experience page has the older roles, awards, workshops, leadership roles and skills from the third resume.
- The About page shows Titus's photo, and its chapters run newest first.
- The source line reads "MIT licensed".
- The README matches the current site.

## 2026-11-09

- The About and Experience pages are filled in from Titus's resumes, with his AI skills work.
- The About page has a contact form. Messages go to a private inbox, and the page shows only the public address.
- The current page is highlighted in both menu rows. Links to other sites open in a new tab.

## 2026-11-08

- First version of the site. It has the titus-humanizer Checker, Rewrite, Any chatbot and Install pages, and placeholder About, Experience and Blog pages.
- The site pulls titus-humanizer's files from its latest release on each build, and rebuilds when a new release comes out.
- The Install page lets your assistant install the skill for you, and it has the promo video.

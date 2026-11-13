# titus-web

The website for Titus Nyarko Nde: skills, plugins, experience and blog posts. It's built with [Astro](https://astro.build) and served free by Cloudflare at https://titusnyarkonde.com/. The old address, https://dr-titus100.github.io/titus-web/, forwards each page to the same page there.

## What's on it

- **Home** (`/`). A short intro, cards that lead to Tools, Blog and Experience, the latest blog posts and a short About me section.
- **Tools** (`/tools/`). One card for each skill or plugin, read from `src/data/tools.ts`.
- **Humanizer** (`/tools/titus-humanizer/`), with its own row of tabs:
  - **Overview.** The live demo, four ways to use the skill, the promo video, how it works, the rules it applies and before-and-after examples.
  - **Checker.** Paste text and see its 0 to 1 score, each pattern highlighted in place and the hidden characters removed. Quoted text stays out of the score and gets a dashed underline instead of highlights. It runs the real `titus_tools.py` in the browser with [Pyodide](https://pyodide.org), so the text never leaves the visitor's device.
  - **Rewrite.** Visitors bring their own Gemini, Claude or OpenAI key. The page sends `SKILL.md` as the instructions, straight from the browser to the provider, then scores the original and the rewrite.
  - **Any chatbot.** Copy-ready rules and short guides for Gemini, Copilot, Perplexity and others.
  - **Install.** Steps for Claude, ChatGPT, Claude Code and Codex, the zip download, the promo video and the examples.
- **Experience** (`/experience/`). Work history with filters for AI, research, industry and teaching, plus education, publications, talks, awards, leadership and skills.
- **About** (`/about/`). Titus's story, newest chapter first, his photo and the contact form.
- **Blog** (`/blog/`). Posts from `src/content/blog/`. Stories carry a "Fiction" label so readers know they are reading fiction. On Cloudflare, each post ends with reader comments, which show up after Titus approves them on `/admin/comments/`. See [Blog comments](#blog-comments).
- **Privacy** (`/privacy/`) and **Terms** (`/terms/`). What each part of the site sends and stores, and the terms for the tools. Update the date at the top of each page when you change it.

## How the skill files get here

The site doesn't keep its own copy of a skill. Instead, `skills.config.json` pins each skill to one release tag, such as `v1.1.0`, and lists a SHA-256 checksum for every file the site uses.

Before each build, `scripts/fetch-skills.mjs` downloads exactly those files from that tag and compares each checksum. If one doesn't match, the build stops, so a moved tag or a changed release can't reach the site. The build never runs the downloaded files. A separate CI job, `check-skills`, runs the scoring script on a sample with read-only permissions to make sure it works, and the site deploys only if both jobs pass.

### How a new skill release reaches the site

1. A skill repo publishes a release.
2. The **Propose skill updates** workflow (`.github/workflows/skill-update.yml`) notices it. It runs when titus-humanizer sends its `skill-released` event, once a day at 07:17 UTC, and when you start it by hand under Actions.
3. It opens a pull request that changes the tag and checksums in `skills.config.json`.
4. You read the release notes and the changes, then merge. Merging deploys the new version.

For the workflow to open pull requests, turn on **Allow GitHub Actions to create and approve pull requests** under Settings, then Actions, then General. Without it, the workflow opens an issue that names the branch instead. GitHub doesn't run checks on pull requests a workflow opens, so close and reopen the pull request to run them.

To bump a skill by hand, run `node scripts/update-skills.mjs` and commit the changed `skills.config.json`.

### The titus-humanizer token

The titus-humanizer release workflow sends the `skill-released` event with a token saved there as `SITE_DISPATCH_TOKEN`. Sending that event needs **Contents: Read and write** on this repo, which also lets the token push code. Two safer choices:

- **Remove the token.** Delete `SITE_DISPATCH_TOKEN` from titus-humanizer's repository secrets. The daily check still picks up each release within a day.
- **Keep it, and protect `main`.** Under Settings, then Rules, then Rulesets, add a branch ruleset for `main` that requires a pull request and blocks force pushes, with no bypass list. The token then can't change `main` directly.

In titus-humanizer, also add a tag ruleset for `v*` that blocks updates and deletions, so a published release tag can't be moved.

A build of this site runs when you push to `main` (this deploys) or `dev` (this only builds, as a check), on every pull request, and when you start it by hand under Actions.

## Security

- **Content Security Policy.** GitHub Pages can't send custom headers, so `scripts/add-csp.mjs` adds the policy to every built page as a `<meta>` tag. It allows each inline script by its hash, the AI providers only on the Rewrite page, Web3Forms and hCaptcha only on pages with the contact form, and Cloudflare Turnstile only on blog posts, when its site key is set. If you add a page that talks to a new host, add the host there.
- **API keys.** The Rewrite page keeps keys in memory unless the visitor turns on Remember, which is hidden on `github.io`. See the comments in `src/pages/tools/titus-humanizer/rewrite.astro`.
- **Models.** The suggested models live in `src/data/providers.ts`, with the date they were last checked. Providers retire models, so check their deprecation pages every few months and update `lastVerified`.

## How changes reach the site

Make every change on the `dev` branch and open a pull request from `dev` into `main`. A push to `dev` builds the site as a check, and merging into `main` deploys it. Add a short note about each change to `CHANGELOG.md`.

## GitHub Pages setup (one time)

In this repo, open Settings, then Pages, and set Source to **GitHub Actions**. The next push to `main` publishes the site.

## Local development

```
npm install
npm run dev        # fetches the skills, then serves the site at http://localhost:4321/titus-web/
npm run build      # builds into dist/
```

The first build downloads the pinned skill files. Later builds reuse them while their checksums still match, so you can build offline. To test an unreleased skill change, copy its files into `public/skills/titus-humanizer/` and run `npx astro dev`, which skips the download step.

## Tests

`npm run build`, then `npm test`. Playwright starts `astro preview` itself, or reuses one already running on port 4321. The tests live in `tests/smoke.spec.ts`, and the page list at its top needs each new page added. The first time, install the browser with `npx playwright install chromium`. The Tests workflow runs the same tests on every push and pull request.

## The overview demo and examples

The demo on the overview page and the before-and-after reports come from `src/data/examples.generated.json`. That file is the pinned scoring script's own output for the texts in `src/data/examples.source.json`. Since titus-humanizer v1.2.0, the script's report has a "Left as-is" line that counts the quotations, code snippets, file paths, links and emoji from the original that came through unchanged, or says which ones changed. The Rewrite page's reports show the same line. The Checker shows the `score` command's "Left as-is and not scored" line, and the score skips links and file paths. Both come from the next titus-humanizer release, so until the site pins it, the glue adds them to the v1.2.0 script. Remove that block from the glue when you bump the version. After you change those texts or bump the skill version, run `node scripts/gen-examples.mjs` (it needs Python 3) and commit both files. `node scripts/gen-examples.mjs --check` fails if the committed file is out of date. The site build only reads the committed file and never runs the script.

## Link previews, icons and the feed

- **Share images.** Link previews use 1200 x 630 images in `public/og/`. After adding a blog post, build the site, start `npx astro preview`, and run `npm run share-images -- http://localhost:4321/titus-web`. That remakes every card, including `public/og/blog/<post>.png` for the new post. Commit the images. A post without its own card uses `public/og/site.png`. The script needs Playwright's Chromium, which `npx playwright install chromium` installs.
- **Icons.** `npm run icons` makes `favicon.ico`, `apple-touch-icon.png`, `icon-192.png` and `icon-512.png` from `public/favicon.svg`.
- **Feed, robots and manifest.** `src/pages/rss.xml.ts`, `src/pages/robots.txt.ts` and `src/pages/site.webmanifest.ts` build these files from the site address and base path, so they stay right when the site moves to its own domain. While the site lives at `github.io/titus-web/`, crawlers read the robots file at the domain root, which this repository can't change. The Sitemap line takes effect after the move.
- **Structured data.** Pass `jsonLd` to the `Base` layout to add JSON-LD to a page. About, the titus-humanizer overview and blog posts use it.

## Fonts and video files

The site's font is Inter, under the SIL Open Font License. The two variable font files and the license are in `src/fonts/`, and `src/styles/global.css` loads them. They came from the `@fontsource-variable/inter` 5.2.5 package.

The tour video has two files in `public/media/`: `titus-humanizer-promo.mp4` at 1080p and `titus-humanizer-promo-720p.mp4` for screens up to 900 px wide. If you replace the video, make the 720p copy with:

```
ffmpeg -i titus-humanizer-promo.mp4 -vf scale=-2:720 -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 96k titus-humanizer-promo-720p.mp4
```

## Captions for the tour video

The tour video has its captions burned into the picture, so they show in every player without a captions button. The same lines, with their timings, live in `public/media/titus-humanizer-promo.en.vtt`, a WebVTT file. `src/components/PromoVideo.astro` builds the "Read the transcript" panel under the video from that file. It doesn't load the file as a captions track, since that would show every line twice. Each cue is a time range and the words spoken in it:

```
WEBVTT

NOTE Release

00:00:00.000 --> 00:00:04.500
The first line of the narration.
```

A `NOTE` line starts a new section of the transcript, and its text becomes the section's title. The cues under it join into one paragraph.

To replace the video, copy the new file to `public/media/titus-humanizer-promo.mp4` (with `-movflags +faststart`) and make the 720p copy for phones:

```
ffmpeg -i new.mp4 -c copy -movflags +faststart public/media/titus-humanizer-promo.mp4
ffmpeg -i new.mp4 -vf scale=-2:720 -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart public/media/titus-humanizer-promo-720p.mp4
```

If you replace the video, update the captions file in the same commit.

## Adding posts, pages and tools

- **A blog post.** Copy `src/content/blog/_template.md` to a new file without the underscore, such as `my-first-post.md`, fill it in and set `draft: false`. It appears at `/blog/my-first-post/`, and the home page lists the three newest posts. For a story, also set `fiction: true`, and the post shows a "Fiction" label everywhere it appears.
- **About and Experience.** The facts on both pages, such as roles, education, publications, talks, awards and skills, live in `src/data/profile.ts`. Change the data there, and edit `src/pages/about.astro` or `src/pages/experience.astro` only to change the layout or the story text.
- **A new skill or plugin.**
  1. Add an entry to `src/data/tools.ts`. Its card then shows up on the Tools page.
  2. Add it to `skills.config.json` if the site should pull its files from its releases. Run `node scripts/update-skills.mjs` to fill in the tag and checksums.
  3. Add its pages under `src/pages/tools/<name>/`. Copy `src/components/ToolNav.astro` if it needs its own row of tabs, and add it to the top menu in `src/layouts/Base.astro` if it should have one.

## Custom domain on Cloudflare

The site can also be hosted on Cloudflare, which can send real security headers and builds a preview of every pull request.

- `wrangler.jsonc` tells Cloudflare to upload `dist/` as static files, together with the small Worker in `worker/index.js` that answers `/api/*` for blog comments. It also turns on preview links for pull requests.
- In Cloudflare's build settings, set the build command to `npm run build` and these build variables: `SITE_URL` to the domain (such as `https://example.com`), `SITE_BASE` to `/` and `SITE_HOST` to `cloudflare`.
- With `SITE_HOST=cloudflare`, `scripts/add-csp.mjs` also writes `dist/_headers`. It blocks framing, turns on HSTS and nosniff, and sets cache times. The Privacy page names Cloudflare as the host, and Rewrite offers Remember my key, because the site has an address of its own.
- The tests run the same way. For a root-domain build, run them with `SITE_BASE=/`.

After the move, set the repository variable `NEW_SITE_URL` to the new address under Settings, then Secrets and variables, then Actions, then Variables. The next deploy to GitHub Pages then publishes only forwarding pages, built by `scripts/make-forwarders.mjs`. Every old `github.io/titus-web/` address sends visitors and search engines to the same page on the new domain.

## Blog comments

Readers can comment under each blog post on the Cloudflare site. Nobody needs an account. A reader types a name and a comment. With the Turnstile spam check on, the comment shows at once after it passes the check, and Titus can delete it later. Without the check, the comment waits until Titus approves it.

- `src/components/Comments.astro` shows the approved comments and the form. It's built only when `SITE_HOST=cloudflare`, because GitHub Pages has no Worker.
- `worker/index.js` is the API. It saves comments in a Cloudflare D1 database (the post, the name, the comment, its status and the time), and creates the table itself on first use. It limits each IP address to 5 new comments a minute, stops taking new comments once 200 wait for approval (only when the spam check is off), and never stores IP addresses. It only accepts comments on posts that exist.
- Readers can reply to any comment. Replies are one level deep, so a reply to a reply joins the same thread. Replies follow the same rule as comments, so they show at once with the spam check on and wait for approval without it. Titus replies from the moderation page. His replies show at once with an "Author" label, which nobody else can get, and replying to a waiting comment approves it. He can also start his own comment on any post from the New comment box there, and it shows at once with the same label. Deleting a comment deletes its replies.
- `/admin/comments/` is the moderation page. Search engines are told to skip it, and it does nothing without the admin token.

### Setting it up on Cloudflare (one time)

1. Merge the pull request. On that first deploy, Wrangler creates a D1 database called `titus-web-comments` and links it to the Worker. You'll see it under Storage and databases, then D1. If that deploy fails on the database, create the database there by hand with that name, and add its ID to `wrangler.jsonc` as `"database_id"`.
2. In the Cloudflare dashboard, open Workers and Pages, then `titus-web`, then Settings, then Variables and secrets. Add a secret named `COMMENTS_ADMIN_TOKEN` with a random value of at least 32 characters. A password manager can make one, or run `openssl rand -hex 32`. Moderation stays off until this secret exists.
3. Open `/admin/comments/` on the site, paste the token and choose Show comments. Approve, reply to or delete each comment there. The browser tab keeps the token until you close it.
4. For an email about each new comment: in the Cloudflare dashboard, open Email Service and set up `titusnyarkonde.com` for sending. Under Email Routing, then Destination addresses, add the address that should get the emails and click the link in the verification email Cloudflare sends there. Then add that address to the Worker as a secret named `NOTIFY_TO`. The email comes from `comments@titusnyarkonde.com` and has the comment, a link to the post and a link to the moderation page. The address lives only in Cloudflare, so it never appears in this repo or on the site. Without `NOTIFY_TO`, no emails go out, and a failed email never stops a comment from being saved.
5. To let comments show at once: create a Turnstile widget for `titusnyarkonde.com` under Turnstile in the dashboard. Put its site key in `commentsTurnstileKey` in `src/data/profile.ts`, and add its secret key to the Worker as a secret named `TURNSTILE_SECRET`. Add the secret after the site key is live, because the Worker turns away comments without a check once the secret exists. The form then shows a Turnstile check, comments that pass it go live at once, and the Privacy page and the form's note say so. Without both keys, every comment waits for approval.

Pull request previews may use the same database as the live site, so a comment posted on a preview can show up on the moderation page. Delete it there.

To test the Worker on your computer, build with `SITE_HOST=cloudflare SITE_BASE=/`, then run `npx wrangler dev --var COMMENTS_ADMIN_TOKEN:<a token of 32 or more characters>`. Wrangler makes a local database, so nothing touches the live one.

## Writing rules

The visible text follows the same rules as titus-humanizer. `scripts/check-copy.mjs` runs after every build and fails it if a page uses an em dash or a semicolon. The check skips code blocks, the "before" examples and quotations kept as written.

Buttons are outlined pills (`.btn` in `src/styles/global.css`) with a thin blue ring and blue text. They fill blue when you hover over or focus them. Links to other sites open in a new tab. `scripts/add-csp.mjs` adds `target="_blank"`, `rel="noopener noreferrer"` and hidden "(opens in a new tab)" text to every outside link after the build, blog posts included. Links to file downloads, such as the release zip, stay in the same tab.

## Contact form

The form on the About page sends messages through [Web3Forms](https://web3forms.com). Only the Web3Forms account holds the address that receives them, so it never appears on the site or in this repo. The site shows only the public address in `publicEmail` in `src/data/profile.ts`.

The access key is already set in `contactFormKey` in the same file. The key only lets visitors send messages to that one inbox, so it's safe to publish. To change the receiving address, create a new key at web3forms.com with the new address and replace `contactFormKey`.

A reply goes to the email address the visitor typed into the form. So, make sure you type the correct email in the form.

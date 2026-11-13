# titus-web

The website for Titus Nyarko Nde: skills, plugins, experience and blog posts. It's built with [Astro](https://astro.build) and served free by GitHub Pages at https://dr-titus100.github.io/titus-web/.

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
- **Blog** (`/blog/`). Posts from `src/content/blog/`. Stories carry a "Fiction" label so readers know they are reading fiction.
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

- **Content Security Policy.** GitHub Pages can't send custom headers, so `scripts/add-csp.mjs` adds the policy to every built page as a `<meta>` tag. It allows each inline script by its hash, the AI providers only on the Rewrite page, and Web3Forms and hCaptcha only on pages with the contact form. If you add a page that talks to a new host, add the host there.
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

## The overview demo and examples

The demo on the overview page and the before-and-after reports come from `src/data/examples.generated.json`. That file is the pinned scoring script's own output for the texts in `src/data/examples.source.json`. After you change those texts or bump the skill version, run `node scripts/gen-examples.mjs` (it needs Python 3) and commit both files. `node scripts/gen-examples.mjs --check` fails if the committed file is out of date. The site build only reads the committed file and never runs the script.

## Fonts and video files

The site's font is Inter, under the SIL Open Font License. The two variable font files and the license are in `src/fonts/`, and `src/styles/global.css` loads them. They came from the `@fontsource-variable/inter` 5.2.5 package.

The tour video has two files in `public/media/`: `titus-humanizer-promo.mp4` at 1080p and `titus-humanizer-promo-720p.mp4` for screens up to 900 px wide. If you replace the video, make the 720p copy with:

```
ffmpeg -i titus-humanizer-promo.mp4 -vf scale=-2:720 -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 96k titus-humanizer-promo-720p.mp4
```

## Captions for the tour video

The tour video's captions live in `public/media/titus-humanizer-promo.en.vtt`, a WebVTT file. When that file exists, `src/components/PromoVideo.astro` adds an English captions track to the video and a "Read the transcript" panel under it, built from the same cues. Each cue is a time range and the words spoken in it:

```
WEBVTT

00:00:00.000 --> 00:00:04.500
The first line of the narration.
```

If you replace the video, update the captions file in the same commit.

## Adding posts, pages and tools

- **A blog post.** Copy `src/content/blog/_template.md` to a new file without the underscore, such as `my-first-post.md`, fill it in and set `draft: false`. It appears at `/blog/my-first-post/`, and the home page lists the three newest posts. For a story, also set `fiction: true`, and the post shows a "Fiction" label everywhere it appears.
- **About and Experience.** The facts on both pages, such as roles, education, publications, talks, awards and skills, live in `src/data/profile.ts`. Change the data there, and edit `src/pages/about.astro` or `src/pages/experience.astro` only to change the layout or the story text.
- **A new skill or plugin.**
  1. Add an entry to `src/data/tools.ts`. Its card then shows up on the Tools page.
  2. Add it to `skills.config.json` if the site should pull its files from its releases. Run `node scripts/update-skills.mjs` to fill in the tag and checksums.
  3. Add its pages under `src/pages/tools/<name>/`. Copy `src/components/ToolNav.astro` if it needs its own row of tabs, and add it to the top menu in `src/layouts/Base.astro` if it should have one.

## Custom domain

Set `SITE_URL` to the domain and `SITE_BASE` to `/` in the build step of `.github/workflows/deploy.yml`, add the domain under Settings, then Pages, and point your DNS at GitHub as its guide explains.

## Writing rules

The visible text follows the same rules as titus-humanizer. `scripts/check-copy.mjs` runs after every build and fails it if a page uses an em dash or a semicolon. The check skips code blocks and the "before" examples.

## Contact form

The form on the About page sends messages through [Web3Forms](https://web3forms.com). Only the Web3Forms account holds the address that receives them, so it never appears on the site or in this repo. The site shows only the public address in `publicEmail` in `src/data/profile.ts`.

The access key is already set in `contactFormKey` in the same file. The key only lets visitors send messages to that one inbox, so it's safe to publish. To change the receiving address, create a new key at web3forms.com with the new address and replace `contactFormKey`.

A reply goes to the email address the visitor typed into the form. So, make sure you type the correct email in the form.

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

## How the skill files get here

The site keeps no copy of any skill. Before each build, `scripts/fetch-skills.mjs` reads `skills.config.json`, finds each skill's latest GitHub release, downloads the files it lists, runs the script once to make sure it works, and writes them to `public/skills/<slug>/`. A broken release stops the build, so it never goes live.

The site always uses each skill's **latest release**, never its main branch. Changes in a skill repo show up here only after you publish a new release there. The version label on the Humanizer pages and the zip on the Install page come from that release.

A build runs when:

- you push to `main` (this deploys) or `dev` (this only builds, as a check),
- a skill repo publishes a release and sends a `skill-released` event (see below),
- every night at 07:17 UTC (12:17 AM in Boise during standard time), as a fallback,
- you start it by hand under Actions.

### Rebuilds after each titus-humanizer release

The release workflow in titus-humanizer sends the `skill-released` event, and it needs a token with access to this repo. The token is already saved in titus-humanizer as `SITE_DISPATCH_TOKEN`. The steps below are for replacing it, or for setting up a new skill repo the same way.

**1. The token**

1. On GitHub, click your profile picture, then open Settings, then Developer settings, then Personal access tokens, then Fine-grained tokens. Choose **Generate new token**.
2. Fill in the form:
   - **Token name:** `titus-web site rebuild`
   - **Description:** `Lets the titus-humanizer release workflow rebuild the titus-web site. Saved as SITE_DISPATCH_TOKEN in titus-humanizer.`
   - **Expiration:** 1 year is a sensible choice. When the token expires, the rebuild step stops working, but the nightly build still picks up new releases. Put a reminder in your calendar to replace the token before it runs out.
   - **Repository access:** choose **Only select repositories** and pick `Dr-Titus100/titus-web`.
   - **Permissions:** under Repository permissions, set **Contents** to **Read and write**. GitHub then sets **Metadata** to Read-only on its own. Leave every other permission on No access, including Actions, Pages and Workflows.
3. Choose **Generate token** and copy it. GitHub shows it only once.

**2. Where the token goes**

1. Open the titus-humanizer repo on GitHub, then Settings. In the left menu, open **Secrets and variables**, then **Actions**.
2. Stay on the **Secrets** tab. The page has two boxes, Environment secrets and Repository secrets. Use the **Repository secrets** box and choose **New repository secret**.
3. Set **Name** to `SITE_DISPATCH_TOKEN`, paste the token into **Secret** and choose **Add secret**.

The next titus-humanizer release then rebuilds the site within a few minutes. Without the secret, the release still works, and the site picks up the new version on its nightly build.

**Replacing an expired token.** Create a new token the same way, then open `SITE_DISPATCH_TOKEN` under Repository secrets in titus-humanizer, choose the pencil icon to edit it and paste the new token.

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

`SKILL_REF=dev npm run dev` uses a branch instead of the latest release, which helps when you test an unreleased skill change. `ALLOW_STALE=1` keeps the last fetched files if GitHub can't be reached.

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
  2. Add it to `skills.config.json` if the site should pull its files from its releases.
  3. Add its pages under `src/pages/tools/<name>/`. Copy `src/components/ToolNav.astro` if it needs its own row of tabs, and add it to the top menu in `src/layouts/Base.astro` if it should have one.
  4. In the new skill's repo, copy the "Rebuild the website" step from titus-humanizer's release workflow and add the same `SITE_DISPATCH_TOKEN` secret.

## Custom domain

Set `SITE_URL` to the domain and `SITE_BASE` to `/` in the build step of `.github/workflows/deploy.yml`, add the domain under Settings, then Pages, and point your DNS at GitHub as its guide explains.

## Writing rules

The visible text follows the same rules as titus-humanizer. `scripts/check-copy.mjs` runs after every build and fails it if a page uses an em dash or a semicolon. The check skips code blocks and the "before" examples.

## Contact form

The form on the About page sends messages through [Web3Forms](https://web3forms.com). Only the Web3Forms account holds the address that receives them, so it never appears on the site or in this repo. The site shows only the public address in `publicEmail` in `src/data/profile.ts`.

The access key is already set in `contactFormKey` in the same file. The key only lets visitors send messages to that one inbox, so it's safe to publish. To change the receiving address, create a new key at web3forms.com with the new address and replace `contactFormKey`.

A reply goes to the email address the visitor typed into the form. So, make sure you type the correct email in the form.

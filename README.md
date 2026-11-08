# titus-web

The website for Titus Nyarko Nde: skills, plugins, experience and blog posts. It's built with [Astro](https://astro.build) and served free by GitHub Pages at https://dr-titus100.github.io/titus-web/.

## What's on it

- **titus-humanizer**, under `/tools/titus-humanizer/`
  - **Checker.** Paste text and see its 0 to 1 score, each pattern highlighted in place and the hidden characters removed. It runs the real `titus_tools.py` in the browser with [Pyodide](https://pyodide.org), so the text never leaves the visitor's device.
  - **Rewrite.** Visitors bring their own Gemini, Claude or OpenAI key. The page sends `SKILL.md` as the instructions, straight from the browser to the provider, then scores the original and the rewrite.
  - **Any chatbot.** Copy-ready rules and short guides for Gemini, Copilot, Perplexity and others.
  - **Install.** Steps for Claude, ChatGPT, Claude Code and Codex, the before-and-after examples and the promo video.
- **About**, **Experience** and **Blog** pages, empty for now.

## How the skill files get here

The site keeps no copy of any skill. Before each build, `scripts/fetch-skills.mjs` reads `skills.config.json`, finds each skill's latest GitHub release, downloads the files it lists, runs the script once to make sure it works, and writes them to `public/skills/<slug>/`. A broken release stops the build, so it never goes live.

A build runs when:

- you push to `main` (this deploys) or `dev` (this only builds, as a check),
- a skill repo publishes a release and sends a `skill-released` event (see below),
- every night at 07:17 UTC, as a fallback,
- you start it by hand under Actions.

### Rebuild on each titus-humanizer release

The release workflow in titus-humanizer sends the `skill-released` event. It needs a token with access to this repo:

1. On GitHub, open Settings, then Developer settings, then Personal access tokens, then Fine-grained tokens, and choose Generate new token.
2. Under Repository access, pick only `Dr-Titus100/titus-web`. Under Permissions, set **Contents** to Read and write. Generate the token and copy it.
3. In the titus-humanizer repo, open Settings, then Secrets and variables, then Actions. Add a secret named `SITE_DISPATCH_TOKEN` and paste the token.

Without the secret, the release still works, and the site picks up the new version on its nightly build.

## Turn on GitHub Pages (once)

In this repo, open Settings, then Pages, and set Source to **GitHub Actions**. The next push to `main` publishes the site.

## Work on it locally

```
npm install
npm run dev        # fetches the skills, then serves the site at http://localhost:4321/titus-web/
npm run build      # builds into dist/
```

`SKILL_REF=dev npm run dev` uses a branch instead of the latest release, which helps when you test an unreleased skill change. `ALLOW_STALE=1` keeps the last fetched files if GitHub can't be reached.

## Add things

- **A blog post.** Copy `src/content/blog/_template.md` to a new file without the underscore, such as `my-first-post.md`, fill it in and set `draft: false`. It appears at `/blog/my-first-post/`.
- **About and Experience.** Edit `src/pages/about.astro` and `src/pages/experience.astro`.
- **A new skill or plugin.** Add it to `skills.config.json` if the site should pull its files, add a card to `src/pages/tools/index.astro`, and add its pages under `src/pages/tools/<name>/`. In the new skill's repo, copy the "Rebuild the website" step from titus-humanizer's release workflow.

## Custom domain

Set `SITE_URL` to the domain and `SITE_BASE` to `/` in the build step of `.github/workflows/deploy.yml`, add the domain under Settings, then Pages, and point your DNS at GitHub as its guide explains.

## Writing rules

The visible text follows the same rules as titus-humanizer. `scripts/check-copy.mjs` runs on every build and fails it if a page uses an em dash or a semicolon.

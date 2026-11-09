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

The release workflow in titus-humanizer sends the `skill-released` event, and it needs a token with access to this repo. You set this up once.

**1. Create the token**

1. On GitHub, click your profile picture, then open Settings, then Developer settings, then Personal access tokens, then Fine-grained tokens. Choose **Generate new token**.
2. Fill in the form:
   - **Token name:** `titus-web site rebuild`
   - **Description:** `Lets the titus-humanizer release workflow rebuild the titus-web site. Saved as SITE_DISPATCH_TOKEN in titus-humanizer.`
   - **Expiration:** 1 year is a sensible choice. When the token expires, the rebuild step stops working, but the nightly build still picks up new releases. Put a reminder in your calendar to replace the token before it runs out.
   - **Repository access:** choose **Only select repositories** and pick `Dr-Titus100/titus-web`.
   - **Permissions:** under Repository permissions, set **Contents** to **Read and write**. GitHub then sets **Metadata** to Read-only on its own. Leave every other permission on No access, including Actions, Pages and Workflows.
3. Choose **Generate token** and copy it. GitHub shows it only once.

**2. Save the token in titus-humanizer**

1. Open the titus-humanizer repo on GitHub, then Settings. In the left menu, open **Secrets and variables**, then **Actions**.
2. Stay on the **Secrets** tab. The page has two boxes, Environment secrets and Repository secrets. Use the **Repository secrets** box and choose **New repository secret**.
3. Set **Name** to `SITE_DISPATCH_TOKEN`, paste the token into **Secret** and choose **Add secret**.

The next titus-humanizer release then rebuilds the site within a few minutes. Without the secret, the release still works, and the site picks up the new version on its nightly build.

**Replacing an expired token.** Create a new token the same way, then open `SITE_DISPATCH_TOKEN` under Repository secrets in titus-humanizer, choose the pencil icon to edit it and paste the new token.

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

## Contact form

The form on the About page sends messages through [Web3Forms](https://web3forms.com), so the address that receives them never appears on the site.

1. Go to web3forms.com, enter the receiving address and choose "Create Access Key". Web3Forms emails the key to that address.
2. Paste the key into `contactFormKey` in `src/data/profile.ts` and merge the change.

The key only lets visitors send messages to that one inbox, so it's safe to publish. Until a key is set, the form says it isn't connected and points people to the public address in `publicEmail`.

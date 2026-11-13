# Working on titus-web

## Branches
- Push every change to the `dev` branch. Don't create a new branch for each change.
- Before you start, bring `dev` up to date with `main`.
- `main` takes changes only through a pull request, so open one from `dev` into `main`. When its required checks pass (`build`, `check-skills` and `smoke`), merge it yourself with a merge commit. This needs no approval from the repository owner. Merging to `main` deploys the site.
- `main` is protected. GitHub blocks force pushes and deletion, and a pull request merges only after its checks pass. If `main` has moved, merge `main` into `dev`, push `dev` and wait for the checks again. Never force-push.

## Rules for the site
- Never put the email address from Titus's résumé anywhere on the site. The contact form sends to it in the background. The only email the site may show is the public Gmail address in `src/data/profile.ts`.
- No phone numbers, referees or résumé PDF.
- Visible text follows titus-humanizer: no em dashes, no semicolons, no "not X, but Y" framing and no slogans. `scripts/check-copy.mjs` checks the first two after every build.

## Checks before you push
- `npm run build`, then `node scripts/check-copy.mjs`
- `node scripts/gen-examples.mjs --check` (remove `public/skills/titus-humanizer/__pycache__` and `public/js/__pycache__` afterward)
- `npx astro preview`, then `npx playwright test`
- Search `dist` for the résumé email. It must not appear anywhere.

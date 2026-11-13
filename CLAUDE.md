# Working on titus-web

## Branches
- Push every change to the `dev` branch. Don't create a new branch for each change.
- When `dev` is ready, open a pull request from `dev` into `main`. Titus merges it. Merging to `main` deploys the site.
- Before you start, bring `dev` up to date with `main`.

## Rules for the site
- Never put the email address from Titus's résumé anywhere on the site. The contact form sends to it in the background. The only email the site may show is the public Gmail address in `src/data/profile.ts`.
- No phone numbers, referees or résumé PDF.
- Visible text follows titus-humanizer: no em dashes, no semicolons, no "not X, but Y" framing and no slogans. `scripts/check-copy.mjs` checks the first two after every build.

## Checks before you push
- `npm run build`, then `node scripts/check-copy.mjs`
- `node scripts/gen-examples.mjs --check` (remove `public/skills/titus-humanizer/__pycache__` and `public/js/__pycache__` afterward)
- `npx astro preview`, then `npx playwright test`
- `grep -rl titusnyarkonde@ dist` must print nothing

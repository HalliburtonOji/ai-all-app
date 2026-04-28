# Contributing

Plain-English notes on how this project's quality gates work.

## Tests run automatically on every push

Every time you `git push` (any branch) or open a pull request to `main`, GitHub Actions automatically:

1. Checks out your code
2. Installs all dependencies
3. Builds the Next.js app the same way Vercel does
4. Runs the full Playwright E2E test suite against the build
5. Cleans up any test users it created in Supabase
6. Uploads test artifacts so you can debug failures

The whole thing takes **about 4–6 minutes**. You don't have to do anything — it just happens.

You'll see a green ✓ next to your commit on GitHub when it passes, or a red ✗ if it fails. Vercel won't block deploys based on test results unless you wire that up separately, so a red ✗ is **a warning, not a brick wall** — you can still ship, but you should fix it fast.

## How to view test results when they fail

1. Go to the **Actions** tab of the repo on GitHub: https://github.com/HalliburtonOji/ai-all-app/actions
2. Click the failed run (the one with the red ✗ next to your commit message).
3. Scroll down — you'll see a section called **"Artifacts"** at the bottom.
4. Two files there:
   - **`playwright-report`** — a zip of the HTML test report. Download it, unzip it, open `index.html` in your browser. You get a clickable list of tests with screenshots, videos, and traces inline.
   - **`test-failures`** — only present if something failed. Has the screenshot + video for each failing test.
5. Most failures are immediately obvious from the screenshot.

## How to run tests locally before pushing

This is the most useful habit. A 30-second local run can save you a 5-minute CI roundtrip and a red commit on GitHub.

```bash
npm run test:e2e        # headless, fastest
npm run test:e2e:headed # watch the browser
npm run test:e2e:ui     # interactive debugger
```

If a test fails locally, the screenshot and video are in `test-results/<test-name>/`.

If everything passes locally, push with confidence — but CI still runs as a safety net in case your machine is missing something CI catches (e.g. a flaky timing issue that only appears on a slower runner).

## Other useful local commands

```bash
npm run dev    # the dev server
npm run build  # production build (same as Vercel does)
npm run lint   # ESLint
```

## Where things live

- `src/app/` — Next.js pages and routes
- `src/components/` — shared React components
- `src/utils/supabase/` — Supabase client setup
- `src/types/` — shared TypeScript types
- `tests/e2e/` — Playwright tests (see `tests/README.md` for how to write more)
- `scripts/` — one-off scripts that aren't part of the app (e.g. test cleanup)
- `.github/workflows/` — CI configuration

## Secrets

Three GitHub repository secrets keep the test workflow running:

- `NEXT_PUBLIC_SUPABASE_URL` — same value as in your `.env.local`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — same value as in your `.env.local`
- `SUPABASE_SERVICE_ROLE_KEY` — **server-only**, never used in app code, never prefixed with `NEXT_PUBLIC_`. Bypasses RLS. Used solely by `scripts/cleanup-test-users.mjs` to delete test users in CI.

If you ever rotate keys in Supabase, update these three secrets in **GitHub repo → Settings → Secrets and variables → Actions**.

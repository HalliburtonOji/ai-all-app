# Tests

This folder holds the **automated end-to-end tests** for AI All App. End-to-end (E2E) means: the test launches a real browser, clicks through real pages, and talks to the real Supabase database — exactly like a human would, but in seconds and without mistakes.

We use **[Playwright](https://playwright.dev/)** as the test runner. It controls Chromium headlessly (invisibly), or visibly when you want to watch.

---

## How to run the tests

From the project root, in your terminal:

| Command | What it does |
|---|---|
| `npm run test:e2e` | Run all tests headlessly. Fastest. Most days, this is what you want. |
| `npm run test:e2e:headed` | Run tests in a visible Chromium window so you can watch every click. |
| `npm run test:e2e:ui` | Open Playwright's interactive UI — pick which test to run, step through, see the DOM at each step. Best for debugging. |

You don't have to start `npm run dev` yourself — Playwright launches the dev server automatically when it needs one (and reuses it if you already have one running on port 3000).

---

## What you'll see when tests pass

```
Running 10 tests using 3 workers

  ✓  1 [chromium] › auth.spec.ts:7:3 › a new user can sign up
  ✓  2 [chromium] › auth.spec.ts:18:3 › logged-out visitor to /dashboard
  …
  10 passed (45s)

To open last HTML report run:
  npx playwright show-report
```

Green checks = pass. The number is how many seconds total. After tests finish, you can run `npx playwright show-report` to open a nice browser-based report.

---

## How to interpret failures

Failures look like:

```
  ✗  3 [chromium] › auth.spec.ts:34:3 › wrong password shows an error
      Error: Timed out waiting for selector "text=Invalid login"
      Screenshot: test-results/auth-wrong-password/test-failed-1.png
      Video: test-results/auth-wrong-password/video.webm
```

Three things to check, in order:

1. **The error message itself.** Often it tells you exactly what didn't happen — a button wasn't found, a URL didn't change, text didn't appear.
2. **The screenshot.** Open the `test-results/.../test-failed-1.png` file to see what the browser actually showed at the moment of failure. 90% of failures become obvious here.
3. **The video.** Open the `test-results/.../video.webm` file to watch the entire test run leading up to the failure.

You can also run `npx playwright show-report` after a failure for a friendly browser UI of the failure with screenshot, video, and step-by-step trace inline.

### Common failure causes

- **Supabase rate-limited the test.** Default is 4 signups/hour per IP. If your tests fail with messages about rate limits or "Email rate limit exceeded", bump the limit in Supabase: **Authentication → Rate Limits → bump signup to 100+/hour for testing**.
- **"Confirm email" is on in Supabase.** Tests can't click confirmation emails. Make sure email confirmation is **OFF** in **Authentication → Sign In / Providers → Email**.
- **Dev server didn't start.** Check the terminal output. If port 3000 is taken by something else, kill it.
- **Database row leftover from a previous run.** Tests don't clean up after themselves yet. Usually fine — each test uses a unique email and unique project name. If something's weirdly stuck, you can manually clear the `projects` table from Supabase's Table Editor.

---

## How to add a new test

1. Pick a file. If it's about auth, edit `e2e/auth.spec.ts`. If it's about projects, edit `e2e/projects.spec.ts`. If it's about a brand new feature, create `e2e/<feature>.spec.ts`.

2. Use this template:

```ts
import { test, expect } from "@playwright/test";
import { signUpNewUser, createProject } from "./helpers";

test("describe what should happen in plain English", async ({ page }) => {
  // 1. Set up — usually sign up a fresh user
  await signUpNewUser(page);

  // 2. Do the thing being tested
  await page.goto("/some-page");
  await page.getByRole("button", { name: "Click me" }).click();

  // 3. Assert what should be true afterwards
  await expect(page.getByText("Expected outcome")).toBeVisible();
});
```

3. Run just that test while developing it: `npx playwright test --headed -g "describe what should happen"` — the `-g` flag does a partial match against the test title.

4. When it's green, commit it. From now on it runs every time the suite runs.

### Helpers you can use

In `e2e/helpers/`:

- `makeTestUser()` — generates `{ email, password }` with a unique email
- `signUpNewUser(page, user?)` — signs up + logs in, lands on `/dashboard`
- `loginAs(page, email, password)` — logs in an existing user
- `logout(page)` — clicks the navbar Log out button
- `createProject(page, { name, type, description? })` — fills the create form and submits, returns the new project ID

### Tips that save time

- Prefer **Playwright's locator helpers** (`getByRole`, `getByText`) over CSS selectors — they're more resilient to design tweaks.
- Use **`expect()` from `@playwright/test`** (not Jest's expect) — it auto-retries until the timeout, so you don't need to manually wait for slow operations.
- **Don't add `setTimeout` / `page.waitForTimeout`** — those create flaky tests. Use `waitForURL`, `expect(...).toBeVisible()`, or `expect(...).toHaveText()` instead.
- Each test should be **independent**: fresh user, fresh data, no relying on what a previous test did.

---

## What's NOT tested here

- The auth pages' Google "Sign in with Google" button (would require automating Google's OAuth UI, which is brittle and against their TOS for headless automation). The button itself is rendered and the OAuth callback route works in production — that's verified manually.
- Supabase email confirmation flow (also requires automating real email).
- Production deploys (Vercel handles its own checks).

If you want to test those, talk to me and we'll figure out an approach.

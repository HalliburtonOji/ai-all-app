# Project context for Claude Code

This is a real production app deployed at https://ai-all-app.vercel.app — not a learning sandbox. Code that ships here affects real users (currently the owner; in the future, real customers).

The owner is **a non-developer**, building this app while learning. When working on this project:

- Default to **clear plain-English explanations** for every step, command, or concept. Don't assume familiarity with terminal commands, frameworks, package managers, git, deploy pipelines, or any specific tooling.
- **Pause and ask before destructive actions** (deleting files, force-pushing, dropping database tables, removing dependencies, modifying CI). Don't execute "obvious" cleanup unilaterally.
- Show the exact command to run and the exact output to expect, not just a vague description.
- When introducing a tool or concept for the first time, give a one-sentence explanation of what it is.

## Testing Rules (binding)

Whenever you build, modify, or remove a feature in this project, you MUST:

1. Add or update Playwright E2E tests covering the feature in `/tests/e2e/`.
2. Tests must cover (a) the happy path, (b) at least one failure case, and (c) at least one security/permissions case where the feature involves user data or authentication.
3. Run `npm run test:e2e` before considering the task complete.
4. If any test fails, fix the test OR fix the feature. **NEVER skip, comment out, weaken, or delete a test to make a build pass.**
5. Update `/tests/STATUS.md` to reflect new test coverage.
6. If a feature is genuinely untestable via E2E, document why in `/tests/STATUS.md` under "Untested by design".

**Definition of Done for any feature:** code works locally + tests pass locally + `STATUS.md` updated.

## How the testing system works at a glance

- **Local:** `npm run test:e2e` runs Playwright tests against the dev server — ~30 seconds.
- **CI:** Every push triggers `.github/workflows/test.yml` — full Playwright suite against a production build, ~4–6 minutes.
- **Production smoke test:** After every push to `main` deploys to Vercel, `.github/workflows/smoke-test.yml` runs `scripts/smoke-test.ts`, which uses the Claude API to drive Playwright through the live site exploratorily. Reports go to `smoke-reports/` (local) or as workflow artifacts (CI).

## Stack quick-reference

- Next.js 16 (App Router) + TypeScript + Tailwind 4
- Supabase: auth (email + Google OAuth) + Postgres (RLS-enforced)
- Vercel: hosting + auto-deploys from `main`
- GitHub Actions: CI for tests + smoke tests
- Playwright: E2E
- @anthropic-ai/sdk + Playwright: AI-driven smoke testing

## Files / folders worth knowing

- `src/app/` — Next.js routes; `(app)/` is the auth-required route group
- `src/utils/supabase/` — Supabase client setup (`server.ts`, `client.ts`, `middleware.ts`)
- `src/types/project.ts` — shared types + label/badge/color maps
- `tests/e2e/` — Playwright tests; helpers in `tests/e2e/helpers/`
- `scripts/smoke-test.ts` — AI-driven smoke tester
- `scripts/cleanup-test-users.mjs` — admin script to delete test users (uses service role key)
- `.github/workflows/test.yml` — CI E2E
- `.github/workflows/smoke-test.yml` — production smoke test

## Secrets

`.env.local` (gitignored): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, optionally `SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY` for local cleanup/smoke runs.

GitHub Actions secrets (Settings → Secrets → Actions): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`.

The service role key bypasses RLS — never import from `src/`, never prefix with `NEXT_PUBLIC_`.

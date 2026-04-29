# Test Health Status

**Last updated:** 2026-04-29 (A2 — user-level memory shipped)

## Coverage by Feature

| Feature | E2E tests | Last updated | Notes |
|---------|-----------|--------------|-------|
| Auth — email signup, login, logout, redirect-when-logged-out, wrong-password handling | 5 | 2026-04-28 | Email/password covered. Google OAuth tested manually (see Untested by design). |
| Projects — create, persist after refresh, edit name inline, delete, RLS cross-user isolation | 5 | 2026-04-28 | Includes a security test that confirms Row Level Security isolates users at the database level. |
| Coach (Part 1) — send + receive message, message persistence, /api/coach auth check, input length validation, RLS cross-user isolation via /api/coach | 5 | 2026-04-28 | Tests run with `E2E_TEST_MODE=true`, deterministic mock responses. |
| Coach (Part 2) — streaming, multi-thread isolation, RLS on /api/coach/stream, rename, delete, auto-title, regenerate, input lock during stream | 8 | 2026-04-29 | Mock streaming emits 4 chunks 50ms apart. Auto-title tested in mock mode. |
| Project memory — edit fact, delete fact, pin sort-to-top, RLS cross-user, memory injection into coach system prompt, 50-fact cap enforcement, cron endpoint auth | 7 | 2026-04-29 | Mock extraction inserts a deterministic `[mock fact …]` row + runs the same cap enforcement, so end-to-end behavior is testable without calling Anthropic. The admin button is exposed to any user when `E2E_TEST_MODE=true` so tests can drive extraction without impersonating the admin. |
| Coach suggestions tray — appears after first response, click fills input (no auto-send), no tray on empty thread, RLS cross-user on /api/coach/suggest | 4 | 2026-04-29 | Mock-mode endpoint returns 3 deterministic suggestions; production calls Sonnet 4.6. Tray renders nothing until first response (or on fresh empty thread). Click pre-fills textarea + focuses it but never auto-sends. |
| User-level (cross-project) memory — edit fact, delete fact (with confirm), pin sort-to-top, RLS cross-user dashboard isolation, injection into coach system prompt across all projects, 100-fact cap enforcement | 6 | 2026-04-29 | Lives on `/dashboard` ("About you" panel). Mock extraction inserts a deterministic `[mock user fact …]` row + runs the same cap enforcement, so end-to-end behavior is testable without Anthropic. Same admin-button bypass via `E2E_TEST_MODE=true` as project memory. |

## Untested by Design

- **"Sign in with Google" OAuth flow** — Google actively prevents headless automation per their TOS. Verified manually after each deploy.
- **Supabase email confirmation flow** — Would require automating a real inbox. Tests run with email confirmation disabled.
- **Coach + extractor model output quality** — We don't assert that responses or extracted facts are "good" — that's subjective + flaky. Smoke test against production exercises real model output. Manual review is the source of truth.
- **Coach streaming chunk count** — Playwright can't easily observe individual SSE frames. We assert the `data-streaming` attribute flips, which proves the consumer saw the stream's open/close states.
- **Real-Anthropic extraction** — Mock mode verifies plumbing (insert + cap + revalidate). Real extraction quality verified by clicking "Run extraction now" on a real project.
- **Production deployment correctness** — Vercel handles its own checks. The post-deploy AI smoke test (`scripts/smoke-test.ts`) is our production-side validation.

## Coverage Gaps to Address

- **Archive / unarchive** toggle on `/projects/[id]` is not E2E-tested. Low risk, cheap to add.
- **New-project form validation** — blank name, name >100 chars, blank type — relies on browser HTML5 validation + server-side checks. Could add explicit E2E.
- **Mobile-viewport rendering** — currently tested manually. Could add a Playwright project with `viewport: { width: 375, height: 667 }`.
- **Description editing** — name editing is tested; description inline-edit uses the same component but isn't independently exercised.
- **Logout from `/projects/[id]`** — logout is tested from `/dashboard`; navbar is the same component.
- **Coach: empty message validation via UI** — covered server-side. No explicit E2E.
- **Coach: Anthropic mid-stream failure path / partial messages** — Server emits `error` event + saves partial=true. UI shows "Response was interrupted." Manual testing only.
- **Coach: token usage accumulation** — `messages.input_tokens` / `output_tokens` only populated on real (non-mock) calls. No assertion.
- **Coach: history trimming at 50+ messages** — server-side log fires; no E2E that seeds 50 messages.
- **Coach: copy-to-clipboard** — Browser clipboard requires extra Playwright permissions; tested manually.
- **Memory: cron run end-to-end** — `/api/cron/extract-facts` auth is tested; the actual scan-all-projects loop is not. Low value — the per-project extraction is what's important and is tested via the admin button.
- **Memory: source_thread_id on fact rows** — In mock mode we set it to the most recent thread; not asserted in E2E.
- **User memory: cron-driven cross-project extraction** — Mock mode + admin button covers the extraction + insert + cap path. The real cron loop (scan all projects per user, dedupe, decide what's profile-level vs project-level) is verified manually by clicking "Run user extraction now" on a real account.
- **User memory: source_project_id attribution on user facts** — Set in extraction (most-recent project of the user); not asserted in E2E.

## Recent Test Runs

| Date | Branch | Outcome | Runtime | Where |
|------|--------|---------|---------|-------|
| 2026-04-29 | main | ✅ pass (40/40, 1 streaming flake on parallel run) | 2.8 min | local (A2 — user-level memory: schema, extraction, injection, dashboard panel, 6 tests) |
| 2026-04-29 | main | ✅ pass (34/34) | 1.9 min | local (Coach suggestions tray + cap-test data-attribute fix) |
| 2026-04-29 | main | ✅ pass (30/30) | 1.7 min | local (Project memory feature complete) |
| 2026-04-29 | main | ✅ pass (23/23) | ~3 min | local (Coach Part 2 complete) |
| 2026-04-29 | main | ✅ pass (15/15) | ~5 min | CI (post Coach Part 1) |
| 2026-04-28 | main | ✅ pass (10/10) | ~5 min | CI |
| 2026-04-28 | main | ✅ pass (10/10) | 16s | local |

## How to keep this file useful

This file exists because Playwright tests + CI artifacts answer "did the last build pass?" but **not** "what's actually covered?" When this file goes stale, you lose situational awareness about coverage gaps.

The CLAUDE.md testing rule binds future contributors (human or AI) to update this file when adding/removing features. If you find a gap that the rule didn't catch, fix the rule too.

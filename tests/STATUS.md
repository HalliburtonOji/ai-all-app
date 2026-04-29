# Test Health Status

**Last updated:** 2026-04-29

## Coverage by Feature

| Feature | E2E tests | Last updated | Notes |
|---------|-----------|--------------|-------|
| Auth — email signup, login, logout, redirect-when-logged-out, wrong-password handling | 5 | 2026-04-28 | Email/password covered. Google OAuth tested manually (see Untested by design). |
| Projects — create, persist after refresh, edit name inline, delete, RLS cross-user isolation | 5 | 2026-04-28 | Includes a security test that confirms Row Level Security isolates users at the database level. |
| Coach (Part 1) — send + receive message, message persistence, /api/coach auth check, input length validation, RLS cross-user isolation via /api/coach | 5 | 2026-04-28 | Tests run with `E2E_TEST_MODE=true`, so the API returns deterministic mock responses (`[mock] I received: …`) instead of calling Anthropic. The non-streaming `/api/coach` endpoint is preserved as a fallback; these tests still exercise it via direct API call. |
| Coach (Part 2) — streaming, multi-thread isolation, RLS on /api/coach/stream, rename, delete, auto-title, regenerate, input lock during stream | 8 | 2026-04-29 | Streaming verified via the `data-streaming="true"` → `"false"` transition on the assistant bubble. Mock streaming emits 4 chunks 50ms apart so timing is deterministic. Auto-title is tested in mock mode (`Mock: <first 3 words>`); real-Sonnet titling is verified manually. |

## Untested by Design

- **"Sign in with Google" OAuth flow** — Google actively prevents headless automation per their TOS. The button is rendered correctly in tests; the callback route is exercised by the Supabase callback. Verified manually after each deploy.
- **Supabase email confirmation flow** — Would require automating a real inbox. Tests run with email confirmation disabled.
- **Coach model output quality** — We don't assert that Claude's responses are "good" or "in character" — that would be subjective + flaky. The smoke test against production exercises real model output and is the closest thing to a quality check. Manual review of conversations is the source of truth.
- **Coach streaming chunk count** — We don't assert "exactly 4 chunks were received" because Playwright can't easily observe individual SSE frames without a custom listener. Instead we assert the `data-streaming` attribute flips, which proves the consumer saw the stream's open and close states (which only happens if at least one chunk was received).
- **Real-Anthropic auto-title quality** — Mock mode verifies the title-update plumbing fires. The actual title text from Sonnet is not asserted; manual verification covers tone/format.
- **Production deployment correctness** — Vercel's deploy pipeline runs its own build/lint checks; we don't duplicate. The post-deploy AI smoke test (`scripts/smoke-test.ts`) is our production-side validation.

## Coverage Gaps to Address

- **Archive / unarchive** toggle on `/projects/[id]` is not E2E-tested. Low risk, cheap to add.
- **New-project form validation** — blank name, name >100 chars, blank type — currently relies on browser HTML5 validation + server-side checks. Could add explicit E2E for the error path.
- **Mobile-viewport rendering** — currently tested manually. Could add a Playwright project with `viewport: { width: 375, height: 667 }` to run the suite at iPhone size. Especially relevant now that the coach has a desktop-vs-mobile sidebar layout.
- **Description editing** — name editing is tested; description inline-edit shares the same component but isn't independently exercised.
- **Logout from `/projects/[id]`** — logout flow is tested from `/dashboard`; the navbar logout button is the same component, so equivalence is implicit, but not explicit.
- **Coach: empty message validation via UI** — covered server-side (Send is disabled when input is empty, API rejects empty), but no explicit E2E test for it. Low priority.
- **Coach: Anthropic upstream failure path / partial messages** — when Anthropic returns 5xx mid-stream, our streaming route saves the partial assistant message with `partial=true` and emits an `error` event. UI shows "Response was interrupted." The client-side Retry button is also tested only manually. Mocking a mid-stream Anthropic failure requires more plumbing than it's worth right now.
- **Coach: token usage accumulation** — `messages.input_tokens` / `output_tokens` are populated only on real (non-mock) calls. No assertion on those columns yet.
- **Coach: history trimming at 50+ messages** — server-side log fires when trimming happens, but no E2E test seeds 50 messages to verify. Low priority.
- **Coach: copy-to-clipboard** — UI button works in browser; Playwright can't verify clipboard contents without `page.context().grantPermissions(['clipboard-read'])` plumbing. Manual verification.

## Recent Test Runs

The 5 most recent local + CI runs.

| Date | Branch | Outcome | Runtime | Where |
|------|--------|---------|---------|-------|
| 2026-04-29 | main | ✅ pass (23/23) | ~3 min | local (Coach Part 2 complete, post sidebar-refactor fix) |
| 2026-04-29 | main | ✅ pass (15/15) | ~5 min | CI (post Coach Part 1) |
| 2026-04-28 | main | ✅ pass (10/10) | ~5 min | CI |
| 2026-04-28 | main | ✅ pass (10/10) | 16s | local |

> Future agents working on this project: append the most recent run to the top of this table after each `npm run test:e2e` or noteworthy CI run. Trim to ~5 entries.

## How to keep this file useful

This file exists because Playwright tests + CI artifacts answer "did the last build pass?" but **not** "what's actually covered?" When this file goes stale, you lose situational awareness about coverage gaps.

The CLAUDE.md testing rule binds future contributors (human or AI) to update this file when adding/removing features. If you find a gap that the rule didn't catch, fix the rule too.

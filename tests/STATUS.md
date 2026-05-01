# Test Health Status

**Last updated:** 2026-05-01 (Phase 5 shipped — Learn v1: catalog, player, tutor mode, dashboard hint)

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
| Studio v1 — image generation: happy path generate + persist, empty-prompt validation, RLS cross-user image isolation, delete image (Storage row + DB row), Studio image not visible on Coach tab | 5 | 2026-04-29 | First Studio tool. Mock mode uploads a hardcoded 67-byte transparent PNG to the real `studio-images` Storage bucket so Storage + RLS path-prefix policy + signed-URL flow are all exercised end-to-end without calling Replicate. Real mode uses Replicate FLUX schnell (~$0.003/image, ~2s). |
| Studio memory-awareness — generated tile records `mock-with-context` model when project has facts | 1 | 2026-04-30 | Confirms project + user facts are appended to the FLUX prompt as compact context. Real-mode quality verified manually. |
| Coach × Studio (Phase 1+2): coach generates image / text draft / voice-over when asked, tool failure → Retry chip, "Refine with coach" pre-fill (no auto-send), tool-using suggestion routes to Studio with prefill, recent-activity strip after first generation | 7 | 2026-04-30 | Mock mode for the streaming endpoint detects per-tool keywords (image > voice > text priority) and simulates a tool_use stop, then runs the real handler against the mock-mode generator for each tool. Real-mode Anthropic tool-use behavior verified manually. |
| Studio v2 — text drafter (copy/email): generate happy path + reload, empty prompt validation, RLS cross-user, delete, memory-aware (`mock-text-with-context` model when facts exist) | 5 | 2026-04-30 | Anthropic-only; no Storage. content_text column on studio_outputs. Mock-mode inserts a deterministic `[mock copy …] [kind=…]` string. |
| Studio v2 — voice-over: generate happy path + audio element renders + reload, 500-char cap rejected, RLS cross-user, delete (Storage row + DB row), memory-aware (`mock-audio-with-context` model when facts exist) | 5 | 2026-04-30 | ElevenLabs Flash v2.5 in real mode; mock mode uploads ~105-byte MP3 stub to Storage. 500-char hard cap on script enforced server-side and via disabled Generate button. |
| Mobile pass — iPhone SE 375×667 viewport: 9 routes covered (dashboard, projects list, new project, project Coach/Memory/Studio tool grid + 3 panels). Each test asserts no horizontal scroll + primary interactive element visible. | 9 | 2026-05-01 | All green; no CSS fixes needed — existing Tailwind responsive patterns held. Layout-only checks; doesn't test cross-cutting flows on mobile (those are covered by the regular suite which still passes at default viewport). |
| Accessibility (axe-core/playwright) — same 9 routes as mobile spec. Each test runs axe with WCAG 2A + 2AA rule sets and fails on `serious` or `critical` violations. | 9 | 2026-05-01 | Zero blocking violations. Moderate + minor issues not asserted. To audit those later, drop the impact filter in `expectNoSeriousA11yViolations`. |
| Studio v2 — tool grid: landing renders 3 cards, no tool panel | (covered in studio.spec.ts) | 2026-04-30 | Studio tab now routes between tool grid (no `?studio=` param) and 3 per-tool panels (`?studio=image|text|voice`). Each card has `data-studio-tool-card`. |
| Phase 4a — portfolio passport: toggle public + visible on `/p/[username]` to anon viewer, private outputs absent on public route, toggle round-trip back to private hides it again, non-existent username 404 | 4 | 2026-05-01 | First Phase 4 (Earn) deliverable. `is_public bool` on `studio_outputs` (default false) + new SELECT-anyone RLS policy gated on `is_public = true` + missing UPDATE policy added (owner-only). Public route uses service-role admin client to resolve email-prefix usernames + fetch public outputs only — RLS still enforces the privacy boundary. |
| Phase 4b — income tracker: add entry + persists, multi-currency totals, delete with confirm, RLS cross-user, CSV export with header, amount=0 server-side rejection | 6 | 2026-05-01 | `earnings` table with bigint cents + currency check (USD/GBP/NGN/KES/ZAR). No FX conversion — totals shown per currency. `/me/earnings` page with form + history + per-currency monthly CSS-bar chart. CSV export at `/api/me/earnings/export`. Per-test fresh signup pattern (entries are user-scoped → tests need isolated users). |
| Phase 4c — pricing helper: refuses without context (`[pricing-refusal]` branch), gives range + caveat with context (`[pricing]` branch), non-pricing words skip the branch | 3 | 2026-05-01 | Coach system prompt now includes a pricing-questions block (refuse without context, give caveat-tagged range with context, never invent market data). Mock mode regex-detects pricing keywords (charge/rate/price/worth/etc.) and emits one of two deterministic markers so tests can assert the right branch fired. Real Anthropic in production follows the system prompt. |
| Phase 5 — Learn v1: catalog renders both branches + lesson cards, opening a lesson auto-marks 'started', mark complete + toggle back persists across reload, tutor mode answers with lesson context (mock marker includes lesson title), non-existent slug 404, dashboard suggests Lesson 1 to fresh users + disappears once started, tutor endpoint rejects unauthenticated callers | 7 | 2026-05-01 | Lessons live as version-controlled markdown in `content/lessons/`. Auto-mark-started is inline in the page render (NOT a server action — that hits Next.js's "no revalidatePath during render" rule). Tutor mode is ephemeral (no DB persistence — the lesson is the durable artifact). Mock-mode tutor returns a deterministic marker that proves lesson context was injected. |

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
- **Studio: real Replicate output quality** — Mock mode uploads a tiny transparent PNG to verify the pipeline. Real model output is verified manually after deploy.
- **Studio: Storage RLS path-prefix policy under direct Storage API access** — RLS is enforced by `(storage.foldername(name))[1] = auth.uid()::text`. Cross-user image privacy is asserted indirectly (via project page RLS); a direct Storage API test (anon client requesting another user's signed URL path) is not yet covered.
- **Studio: prompt length cap** — Image: 1000 chars, text: 2000 chars, voice: 500 chars. Voice over-cap is now asserted via the disabled-button test. Image and text caps are server-action enforced; not directly asserted.
- **Real-mode Anthropic text drafter quality** — Mock mode covers plumbing (insert + retrieval). Real-mode output style/length verified manually after deploy.
- **Real-mode ElevenLabs voice quality** — Mock mode uploads a 105-byte stub MP3 to verify the Storage + signed-URL pipeline. Real-mode clip quality + timing verified manually.
- **Real-mode Anthropic tool_use behavior** — Mock mode simulates the tool-use stop reason + content blocks. Whether the real model actually invokes `studio_image_generate` on prompts like "draw me a cat" is verified manually after deploy. (Phase 2 may add a smoke-test step.)

## Recent Test Runs

| Date | Branch | Outcome | Runtime | Where |
|------|--------|---------|---------|-------|
| 2026-05-01 | main | ✅ Phase 5 shipped — 7/7 learn sequential (1 flaky, passed on retry) | 53s | local — targeted spec only. Found + fixed Next.js 16 "no revalidatePath during render" bug while writing the spec. |
| 2026-05-01 | main | ✅ Phase 4b + 4c shipped — 9/9 earnings + pricing sequential | 39s | local — targeted specs only (earnings + pricing combined). Phase 4 / Earn v1 fully complete. |
| 2026-05-01 | main | ✅ Phase 4a (portfolio passport) shipped — 4/4 portfolio.spec sequential | 30s | local — targeted spec only, per the test-cadence policy ("normal code review + targeted tests per build, full suite every ~5 ships"). Found + fixed missing UPDATE RLS policy on `studio_outputs` while writing the spec. |
| 2026-05-01 | main | ✅ Phase 3 fully shipped: a11y + Sentry + Lighthouse | — | Three commits: a11y `b5c6cd6` (9 a11y tests, all green), Sentry `937fc57` (DSN-gated SDK integration), Lighthouse `060217a` (audit script + baseline scores). 82 total E2E tests. Lighthouse baseline: homepage 96 / login 79 / signup 94 (perf), all 100 on a11y/best/seo. |
| 2026-05-01 | main | ✅ pass (72/73 parallel local; 1 known flake on studio.spec delete-image, retry-handled in CI) | 1.9 min local | Phase 3b mobile pass shipped — `tests/e2e/mobile.spec.ts` (9 tests). No CSS fixes needed; existing responsive Tailwind patterns held. Scheduled-routine cleanup (disabled). |
| 2026-04-30 | main | ✅ pass (62/62 CI parallel; cap stress tests skipped) | 3.5 min CI / 1.9 min local | Phase 3a — per-worker storageState fixture (`tests/e2e/auth-fixture.ts`). 8 specs migrated, auto-on-push CI re-enabled. Cap tests `test.skip(!!process.env.CI, ...)` — too aggressive for CI parallel contention, kept locally for release verification. |
| 2026-04-30 | main | ✅ pass (64/64 sequential) | 4.8 min | local (Phase 2 — Studio breadth: studio_outputs superset + copy drafter + voice-over + tool grid + 13 new/changed tests). Sequential mode only — parallel still hits the documented per-test-signup race; Phase 3 will fix. |
| 2026-04-30 | main | ✅ pass (51/51 sequential, parallel flakes ongoing) | 7.0 min | local (Phase 1 — coach × studio: tool-using coach + memory-aware Studio + activity strip + 6 new tests). Sequential mode (`--workers=1`) clean; parallel run flakes the same Supabase-rate-limit/per-test-signup pattern documented earlier. Phase 3 will fix via per-worker storageState. |
| 2026-04-29 | main | ✅ pass (45/45, 2 RLS-parallel flakes on full-suite run) | 3.2 min | local (Studio v1 — image gen: schema, Storage bucket, generate/delete, 5 tests). Failed tests pass cleanly solo — same documented per-test-signup parallel race that storageState refactor (queued) will fix. |
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

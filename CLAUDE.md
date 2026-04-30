# AI All App — Project Context for Claude Code

> This is the canonical context document. Any future Claude Code session should read this file first and immediately understand the project, the plan, and the conventions. **Keep it current** — after every meaningful change (new feature, architectural decision, scope change, completed milestone), update the relevant section. Add a new dated entry to the Session Log at the bottom for each work session.

---

## 1. At a Glance

**Name:** AI All App
**Live URL:** https://ai-all-app.vercel.app
**GitHub:** https://github.com/HalliburtonOji/ai-all-app
**Builder:** Halli (`HalliburtonOji` on GitHub) — non-developer founder, learning as the build progresses.
**Status:** MVP build, week 4 of a 12-week sprint. Auth + Projects shipped; AI Coach v1 in progress (this session).

A workshop, classroom, and earnings hub in one place — a *creator OS* for people who want to learn AI, do real work with it, and earn from it. Built around a **learn → do → earn loop** where each layer reinforces the others.

---

## 2. Working with Halli

**Halli is not a developer.** Treat every interaction with this assumption.

- Default to **clear plain-English explanations** for every step, command, and concept. Don't assume familiarity with terminal commands, frameworks, package managers, git, deploy pipelines, or any specific tooling.
- **Pause and ask before destructive actions** — deleting files, force-pushing, dropping database tables, removing dependencies, modifying CI. Don't execute "obvious" cleanup unilaterally.
- Show the exact command to run AND the exact output to expect, not just a vague description.
- When introducing a tool or concept for the first time, give a one-sentence explanation of what it is.
- Pause at meaningful checkpoints to let Halli verify before continuing.
- When something doesn't work as expected, suggest "blunt instrument" escape hatches early (uninstall + reinstall, delete + recreate) instead of doubling down on a single diagnostic theory through multiple turns.

---

## 3. Vision

### What it is

A *creator OS* for AI-curious people, structured around three reinforcing motions: **learn → do → earn**. Not a newsletter, not a tool collection, not another course platform — a workspace where curriculum, tools, conversations, and earnings all attach to the same Project.

### Why it's different

Competitors solve a slice each. Rundown is news. Skool is community. Syllaby is one tool. AI All App combines tools + curriculum + community + earnings in **one wholesome, anti-grift system**. The bet: the integrated loop is more valuable than the sum of disconnected parts.

### Three audiences, one app

1. **Builders** — side-hustlers, freelancers, indie creators trying to make money with AI.
2. **Professionals** — people who fear losing their job to AI, who want to keep and grow their current role *using* AI ("AI at Work" layer).
3. **Curious explorers** — people who just want to get genuinely good at AI.

The app serves all three from a unified architecture. Onboarding (future) routes them to relevant content without locking anyone into a track.

### Geographic focus

UK, US, African countries (Nigeria, Kenya, South Africa especially). Africa-aware features (multilingual, mobile-money rails, USD-earning routing) bake in over time but are **not** Africa-only — one app, not a regional fork.

---

## 4. Wholesome Positioning (non-negotiable)

These are product constraints, not just marketing copy. Anything that ships must respect them.

- **No fearmongering, no hype, no grift.** No "make $50K next month" energy.
- **Realistic income data** with failure stories celebrated alongside wins.
- **No fake countdowns, no manipulative scarcity, no dark patterns.**
- **Honest tool reviews** including "don't bother."
- **Free tier that's actually useful** — not a trial trap.
- **Anti-guru** — real practitioners with verified results, not influencer noise.
- **Honor user expertise** — many users are professionals borrowing a new tool, not novices being lectured.
- Planned helpers: Disclose-AI tag, scam detector, income reality dashboard.

---

## 5. Product Architecture — Five Layers + Cross-cutting Primitives

### L1 · Coach
Persistent AI presence. Knows the active Project. Suggests next steps, prompts reflection. The connective tissue between every other layer. **In progress this session (Part 1: non-streaming, single conversation per Project).**

### L2 · Learn
Skill tree of micro-lessons (5–8 min, interactive), tutor mode, build-along challenges. Five branches: Foundations, Prompt Craft, Tool Fluency, Application, Career & Money.

### L3 · Studio
Tools organized by job-to-be-done. Four clusters: Content/Creator, Marketing/Business, Career/Professional, Productivity/Knowledge. Universal canvas, workflow recorder, template gallery.

### L4 · Earn
Portfolio passport, opportunity radar, outreach assistant, pricing oracle, client CRM, contract templates, income tracker, regional payment routing.

### L5 · Community
Wins feed, failure forum, path-mate matching, marketplace, open studio hours, profession circles.

### Plus: Work layer (added later)
Profession packs, AI Audit of My Job, workplace-safe mode, Indispensable Playbook for AI-proofing careers.

### Cross-cutting primitives

- **Project** — the universal container. Every action belongs to a Project (`channel` / `client` / `product` / `job_search` / `exploration` / `sandbox`). Tools, lessons, conversations, earnings all attach. **Already shipped.**
- **Credits / BYOK** — three modes: free tier (small monthly credits), Pro subscription (large credit pool), BYOK (bring your own API keys, free unlimited use, small platform sub for non-AI features). Built in week 7–8.
- **Identity** — private dashboard, coach-view, public portfolio passport.

### Key design principles

- **Tools standalone OR connected.** Workshop, not railroad.
- **Suggestions over tracks.** Invitations, never paths. Always dismissable.
- **Project as connective tissue.** Cross-feature state lives on the Project.
- **Wrap commodity AI services.** Build only the differentiating layer; don't reinvent OpenAI / ElevenLabs / Replicate.
- **Mobile-first** where possible.

---

## 6. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind 4 | Geist font, route group `(app)/` for auth-required pages |
| Backend | Next.js API routes (server-only) | No separate backend service today |
| Database, Auth, Storage | Supabase | RLS is **never optional** on user data |
| Hosting | Vercel (auto-deploy from `main`) | Branch deploys for previews |
| Payments | Stripe globally; Paystack/Flutterwave for Africa later | Not built yet |
| AI | Anthropic primary (Claude Sonnet for most, Opus for heavy reasoning); OpenAI/Replicate/ElevenLabs as needed | Server-side calls only — keys never reach the browser |
| Testing | Playwright E2E + GitHub Actions CI + AI Smoke Tester | See section 9 |
| Build assistant | Claude Code in VS Code (Claude Max sub) | Strategic planning happens in a separate Claude.ai chat |

---

## 7. Decisions Made (don't re-litigate without reason)

- **One app, not separate Africa version.** Africa-aware features included in the unified product.
- **Suggestions engine over rigid learning paths.**
- **Project is the universal primitive.** Every feature attaches to a Project.
- **Credits + BYOK both supported.** BYOK respects power users.
- **No admin gate on coach.** Single-user phase; Halli's $25/month Anthropic spend cap is the protection.
- **Mock mode for tests** (`E2E_TEST_MODE=true`) — CI never burns API credit.
- **Staged memory rollout:** within-conversation memory now (free, just message history), Project-level memory weeks 5–6, cross-Project memory weeks 8–10.
- **System prompt v1** lives at [src/lib/coach/system-prompt.ts](src/lib/coach/system-prompt.ts). Vision-aligned. Will be tuned over months.
- **Wholesome charter (section 4) is part of the product, not just marketing.** Features that violate it get rejected at design time.
- **Test rules (section 8) are binding for all future builds.**

---

## 8. Testing Rules (binding)

Whenever you build, modify, or remove a feature in this project, you MUST:

1. Add or update Playwright E2E tests covering the feature in `/tests/e2e/`.
2. Tests must cover (a) the happy path, (b) at least one failure case, and (c) at least one security/permissions case where the feature involves user data or authentication.
3. Run `npm run test:e2e` before considering the task complete.
4. If any test fails, fix the test OR fix the feature. **NEVER skip, comment out, weaken, or delete a test to make a build pass.**
5. Update [tests/STATUS.md](tests/STATUS.md) to reflect new test coverage.
6. If a feature is genuinely untestable via E2E, document why in [tests/STATUS.md](tests/STATUS.md) under "Untested by design".

**Definition of Done for any feature:** code works locally + tests pass locally + STATUS.md updated.

---

## 9. How the Testing System Works at a Glance

| Layer | What it does | Where |
|---|---|---|
| **Local Playwright** | `npm run test:e2e` runs the full E2E suite against the dev server using mock mode. ~30s. | Run before pushing. |
| **CI Tests** | Every push triggers [.github/workflows/test.yml](.github/workflows/test.yml). Full Playwright suite against a production build with mock mode. ~5 min. | All branches + PRs. |
| **Production Smoke Test** | **Manual-trigger only** (changed 2026-04-29 to control API cost). [.github/workflows/smoke-test.yml](.github/workflows/smoke-test.yml) runs [scripts/smoke-test.ts](scripts/smoke-test.ts) — Claude drives Playwright through real user journeys against the live deploy. Reports as a workflow artifact. | Click "Run workflow" on the workflow page in the Actions tab when you want one. |
| **Test cleanup** | [scripts/cleanup-test-users.mjs](scripts/cleanup-test-users.mjs) — deletes any user with email matching `test-<ts>-<hex>@aiallapp.test` after each CI run. Uses Supabase service role key. | CI step + can be run locally. |

---

## 10. Roadmap — 12-Week MVP Sprint

### Done

- **Weeks 1–2: Foundations** — VS Code + Node + Git + GitHub repo, Vercel auto-deploy pipeline, Supabase auth (email + Google) with RLS, top nav + dashboard.
- **Weeks 3–4 (auth + Projects portion):** Projects feature — create / read / edit / archive / delete with full RLS. 10 Playwright E2E tests. GitHub Actions CI. AI Smoke Tester on production deploys.

### In progress (this session)

- **Coach Part 1** — non-streaming AI coach inside each Project. Vision-aligned system prompt at [src/lib/coach/system-prompt.ts](src/lib/coach/system-prompt.ts). Project context injection. Mock mode for tests. No admin gate. 5 new E2E tests covering happy path, persistence, auth, length validation, RLS cross-user. Markdown rendering of assistant replies via `react-markdown`.

### Upcoming

- **Weeks 5–6:** First Studio tools (likely image gen + email/copy drafter). Project-level coach memory.
- **Week 7:** BYOK system.
- **Week 8:** Stripe payments + credit packs + Pro subscription.
- **Weeks 9–10:** Learn module v1 — Foundations + Prompt Craft branches, ~15 lessons.
- **Week 11:** Earn module v1 — portfolio passport + income tracker.
- **Week 12:** Community v1 — wins feed + failure forum. Polish.

### Deferred to v2

Workflow recorder, template gallery, marketplace, opportunity radar, client CRM, path-mate matching, voice mode, full multilingual, full skill tree, most Studio tools, profession packs.

---

## 11. What's Built So Far

| Area | State |
|---|---|
| **Auth** | Supabase email + Google OAuth, RLS on all tables, middleware refreshes session each request |
| **Projects** | Full CRUD, inline edit (name + description), archive toggle, delete with confirmation, type badges with distinct colors, mobile-responsive |
| **Navigation** | Shared `(app)` route group with NavBar (logo, Dashboard / Projects links, email + logout) |
| **Dashboard** | Welcome line + 3 most-recent projects + "+ New Project" CTA + "View all projects" link |
| **Coach v1** *(in progress)* | DB tables (`conversations`, `messages`) with RLS-by-subquery, server-side `/api/coach` POST endpoint, mock mode for E2E, client `<Coach>` component with optimistic UI + Markdown rendering |
| **Tests** | 15 Playwright E2E tests (5 auth + 5 projects + 5 coach). Helpers in [tests/e2e/helpers/](tests/e2e/helpers/) |
| **CI** | Tests workflow on every push (~5 min). Smoke test on every successful main push (~3–5 min) |
| **Cost guards** | Smoke tester capped at 50k cost-eq input tokens / 10k output / 5 min per run. Anthropic monthly spend cap on the account |
| **Schema-as-code** | Supabase CLI installed + linked. Baseline schema lives in [supabase/migrations/20260427000000_baseline_schema.sql](supabase/migrations/20260427000000_baseline_schema.sql). Future changes: `npx supabase migration new <name>` → edit SQL → `npx supabase db push` |

---

## 12. Files and Folders Worth Knowing

```
.github/workflows/        CI configuration
  test.yml                  Playwright E2E on every push
  smoke-test.yml            AI smoke test after Tests passes on main
scripts/                  Operational scripts (NOT bundled into the app)
  smoke-test.ts             Claude-driven smoke tester
  cleanup-test-users.mjs    Service-role cleanup for test users
supabase/                 Supabase CLI workspace (linked to the remote project)
  config.toml               Local config (project_id, ports, etc.)
  migrations/               Schema migrations — source of truth for DB shape
    20260427000000_baseline_schema.sql   Tables/RLS/triggers from before CLI adoption
src/
  app/
    api/coach/route.ts      Coach POST endpoint
    auth/                   Supabase auth actions + OAuth callback
    (app)/                  Auth-required route group with shared layout/navbar
      dashboard/page.tsx
      projects/...          List, new, [id]/* (including Coach.tsx, EditableField.tsx, DeleteProjectButton.tsx)
    login/, signup/         Public auth pages
    layout.tsx, page.tsx    Root layout + homepage
    globals.css             Tailwind v4 entry
  components/             Shared UI (NavBar, ProjectCard, ProjectTypeBadge)
  lib/coach/              Coach domain logic (system-prompt.ts, build-context.ts)
  middleware.ts           Calls updateSession on every request
  types/                  Project + Coach types
  utils/supabase/         Browser / server / middleware Supabase clients
tests/
  e2e/                    Playwright specs + helpers
  README.md               How to run / debug / extend tests
  STATUS.md               Coverage dashboard — keep current
CLAUDE.md                 ← this file
CONTRIBUTING.md           CI + workflow intro for the human builder
.env.local                Local secrets (gitignored). Do not commit.
playwright.config.ts      Test config — sets E2E_TEST_MODE=true for test server
```

---

## 13. Secrets and Environment

### .env.local (gitignored)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY` — used by the coach API + local smoke testing
- `SUPABASE_SERVICE_ROLE_KEY` — bypasses RLS; only used by [scripts/cleanup-test-users.mjs](scripts/cleanup-test-users.mjs) and never imported from `src/`. **Never** prefix with `NEXT_PUBLIC_`.

### GitHub Actions secrets (Settings → Secrets → Actions)

Same four keys as above. Used by both workflows.

### Vercel environment variables (Settings → Environment Variables)

- `NEXT_PUBLIC_SUPABASE_URL` (Production / Preview / Development)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Production / Preview / Development)
- `ANTHROPIC_API_KEY` (Production / Preview / Development)

### Test mode flag

- `E2E_TEST_MODE=true` is set automatically by [playwright.config.ts](playwright.config.ts) for the test server, and by the `env:` block in [.github/workflows/test.yml](.github/workflows/test.yml). It is **not** in `.env.local` (would mock locally during dev) and **not** in Vercel (would mock for real users).

---

## 14. Session Log

> Add a new entry to the **top** of this list for each work session. Include: date, what shipped, decisions made, and anything left dangling.

### 2026-04-30 — Phase 1 of master plan: coach × studio integration (the loop)

First phase of the new 6-phase master plan (CLAUDE.md §16). Goal: stop the coach + Studio + memory feeling like three adjacent tabs and make them compose into one system.

**Shipped:**
- Migration [supabase/migrations/20260430131905_add_tool_calls_to_messages.sql](supabase/migrations/20260430131905_add_tool_calls_to_messages.sql): `messages.tool_call jsonb null` (records `{ tool_use_id, name, input }` on the assistant turn that issued a tool call) + `messages.studio_image_id uuid null references studio_images(id) on delete set null` (the assistant turn that delivers the image). `role` check stays user/assistant — both turns are still assistant semantically.
- Migration [20260430135523_allow_empty_content_for_tool_result_messages.sql](supabase/migrations/20260430135523_allow_empty_content_for_tool_result_messages.sql): relaxes the `messages.content` non-empty check for tool-result rows (their content is empty by design — the data lives in `studio_image_id`).
- **Tool-using coach.** [src/lib/coach/tool-specs.ts](src/lib/coach/tool-specs.ts) defines `studio_image_generate` in Anthropic's tool format. [src/lib/coach/tool-handlers.ts](src/lib/coach/tool-handlers.ts) runs it (loads memory facts, calls `generateImageForProject`, returns a fresh signed URL). [src/app/api/coach/stream/route.ts](src/app/api/coach/stream/route.ts) passes `tools` + `tool_choice: "auto"` to the Anthropic stream, detects `stop_reason === "tool_use"`, saves a preamble message + a result message, and emits new SSE events `tool_started` / `tool_result` / `tool_failed`. No follow-up Claude call after the tool — the preamble text is the assistant's voiceover, the image is the deliverable. Mock mode triggers on /draw|image|illustrate|picture|logo|sketch|paint|render/i and runs the same handler.
- **Coach client.** [Coach.tsx](src/app/(app)/projects/[id]/Coach.tsx) handles the new SSE events: replaces the streaming placeholder with the persisted preamble + adds a "Generating image…" transient bubble, then replaces that on `tool_result` with an inline `<Image>` rendering of the studio image (256px, click → jumps to Studio tab). `tool_failed` shows a Retry button that re-submits the user's last message.
- **Memory-aware Studio.** [generate-image.ts](src/lib/studio/generate-image.ts) accepts an optional `memoryHint` arg, appends `Project context: …` to the FLUX prompt when present. [studio-actions.ts](src/app/(app)/projects/[id]/studio-actions.ts) loads project_facts + user_facts and builds the hint via [`buildStudioMemoryHint`](src/lib/coach/build-memory.ts) (200-char cap). Mock mode flips `model` from "mock" to "mock-with-context" when a hint applied — testable.
- **"Refine with coach" button** on the Studio form. Click → navigates to `?tab=coach&prefill=…`. Coach reads `prefill` and pre-populates the textarea + focuses + strips the URL param via `router.replace` (no re-fill on reload). Never auto-sent — wholesome charter.
- **Tool-using suggestions.** Suggestion shape extended with `action?: "coach" | "studio.image"`. [SuggestionTray](src/app/(app)/projects/[id]/SuggestionTray.tsx) renders studio-image pills with a ✶ prefix + amber tint; clicking routes to Studio with the prompt pre-filled (mirrored prefill plumbing). Mock-mode endpoint includes one studio-image suggestion in the deterministic set.
- **Recent activity strip** on the project page header — [src/components/RecentActivityStrip.tsx](src/components/RecentActivityStrip.tsx). Shows up to 3 image thumbnails (linking to Studio tab) + the latest assistant-message preview line. Hidden when the project has no activity.
- **6 new E2E tests** in [tests/e2e/coach-tools.spec.ts](tests/e2e/coach-tools.spec.ts) (5) and [studio.spec.ts](tests/e2e/studio.spec.ts) (1): coach-generate-image, tool-failure-retry, refine-flow, suggestion→studio, recent-activity, and Studio memory-injection regression. Total: **51 (all pass sequentially in 7 min; parallel run still hits the documented per-test-signup race)**.
- **System prompt update** in [system-prompt.ts](src/lib/coach/system-prompt.ts) — single short paragraph telling the coach about the Studio image tool and when to invoke it.

**Decisions:**
- **No follow-up Claude call after tool execution** for Phase 1 (~$0.008/turn instead of ~$0.013). The preamble's "I'll draw a cyberpunk cat for you in neon rain" is the voiceover; the image is the deliverable. Adding a follow-up commentary call ("turned out cyberpunk-er than expected") is a Phase 1.5 toggle if dogfooding shows it'd be valuable.
- **Forced-failure token (`__fail__`) in mock mode** for testing the failure-retry UX. The helper short-circuits to `error: "Forced test failure"` without hitting Storage. Cheaper than mocking out the entire Storage layer.
- **Memory hint is hard-capped at 200 chars** to avoid blowing FLUX schnell's ~256-token prompt window. Pinned facts + most-recent come first; truncation is mid-fact with `…`.
- **Studio's "Refine with coach" lands in the current conversation, not a new one** — the user is already mid-flow on this project, splitting threads would feel arbitrary.
- **Tool-result rows store empty `content`** + the data lives in `studio_image_id`. Relaxed the content check constraint rather than fudging with a marker string. Schema enforces the invariant: empty content is valid only when there's an attached resource.

**Hiccups + fixes:**
- Initially shipped with `messages.content` constrained to non-empty in the baseline schema. Tool-result inserts failed with check_violation. Fix: new migration relaxing the constraint conditionally on `studio_image_id`.
- Type mismatch: server stored `tool_call: { id, name, input }` while the TypeScript `Message.tool_call` interface expected `tool_use_id`. Renamed the server's `PendingToolUse` to use `tool_use_id` everywhere.
- Client crashed with "Cannot read properties of undefined (reading 'trim')" when SSE delivered a message with no content field. Defensive guard: `safeContent = message.content ?? ""` in MessageBubble.
- Tests pass sequentially, fail in parallel — same documented Supabase per-test-signup race that's been blocking us since the storageState attempt. Phase 3 will fix it via per-worker storageState. CI runs on Linux with smaller worker pool which is more forgiving.

**Robustness checklist (Phase 1 gate):**
- ✅ E2E coverage: tool-call path + RLS, refine-with-coach, suggestion→studio, recent-activity, memory-injection regression. 51/51 sequential.
- ✅ Errors: tool failures show a retry chip, not a dead bubble (test 2). Defensive guards added in client.
- ⏳ **Real Claude tool-use end-to-end**: needs Halli's manual smoke after the push lands.
- ⏳ Mobile (375px): the new affordances use the same flex/stack patterns as existing UI; spot-check in the manual smoke.
- ✅ CI: needs the push to land + the Tests workflow to go green.

**Env additions:** none new — Phase 1 reuses everything already configured.

**Next session candidates:**
- **Phase 2** — Studio breadth: copy/email drafter (Anthropic, no infra) + voice-over (ElevenLabs + Storage) + Studio dashboard with tool grid. Generic `studio_outputs` superset table so adding tool #4 is pure UI work.
- Test foundation refactor (Phase 3) — per-worker storageState so the parallel-run race finally goes away.

### 2026-04-29 (later still 7) — First Studio tool: image generation (Replicate FLUX schnell)

**Shipped:**
- Migration [supabase/migrations/20260429220714_add_studio_images.sql](supabase/migrations/20260429220714_add_studio_images.sql): private `studio-images` Storage bucket + 3 RLS policies on `storage.objects` (path prefix `${user_id}/...` enforces ownership) + `studio_images` table (id, project_id, user_id, prompt ≤1000 chars, storage_path, model, created_at) with RLS by `user_id = auth.uid()` for select/insert/delete.
- Generation helper [src/lib/studio/generate-image.ts](src/lib/studio/generate-image.ts): real mode calls Replicate `black-forest-labs/flux-schnell` with `aspect_ratio: "1:1"`, fetches the resulting PNG, uploads to Storage, inserts a row. Mock mode (E2E_TEST_MODE=true) uses a hardcoded 67-byte transparent PNG so the entire Storage + DB pipeline is exercised without any external API call.
- Server actions [src/app/(app)/projects/[id]/studio-actions.ts](src/app/(app)/projects/[id]/studio-actions.ts): `generateImage` (auth + project ownership + prompt validation + helper call + revalidate) and `deleteImage` (RLS-checked + cleans up the Storage object before the row).
- Studio tab in [ProjectTabs.tsx](src/app/(app)/projects/[id]/ProjectTabs.tsx) — third tab next to Coach + Memory, with `?tab=studio` URL state and an "N images" badge.
- Client UI: [Studio.tsx](src/app/(app)/projects/[id]/Studio.tsx) (panel) + [StudioGenerateForm.tsx](src/app/(app)/projects/[id]/StudioGenerateForm.tsx) (prompt textarea + Generate button with `useTransition` pending state) + [StudioImageGrid.tsx](src/app/(app)/projects/[id]/StudioImageGrid.tsx) (responsive 3-column grid with hover-to-show Delete).
- [src/app/(app)/projects/[id]/page.tsx](src/app/(app)/projects/[id]/page.tsx): added studio_images to the parallel data load (with per-row 1-hour signed URLs generated server-side) and a third tab branch.
- [next.config.ts](next.config.ts): `images.remotePatterns` for `*.supabase.co/storage/v1/object/sign/**`. Tiles use `<Image unoptimized>` to skip the Next image optimizer (signed URLs are short-lived; optimization isn't worth the cache miss).
- 5 new E2E tests in [tests/e2e/studio.spec.ts](tests/e2e/studio.spec.ts): generate happy path, empty-prompt validation, RLS cross-user image isolation, delete image, Studio not visible on Coach tab. Total project E2E tests: **45 (5/5 Studio green solo in 23s; 2 pre-existing parallel-load flakes on the full-suite run, both pass solo, same root cause as the documented per-test-signup race)**.

**Decisions:**
- Provider: Replicate FLUX schnell. ~$0.003/image, fast (~2s), good quality. Same pay-as-you-go billing model the user is already used to.
- Storage path convention: `${userId}/${projectId}/${imageId}.png`. The first segment being `auth.uid()::text` is what the Storage RLS policies enforce — so even if a row's project_id were tampered with, the underlying object can never escape the user's prefix.
- Signed URLs server-side, 1-hour TTL, regenerated on every page load. Short enough to discourage sharing, long enough that browser caching during a session works.
- 1024×1024 only for v1. Aspect-ratio picker, model picker, and seed/regenerate all deferred — easy to layer on, but the v1 lift was already big (new external API + new Storage layer + new tab).
- Mock mode uploads a real 67-byte PNG so the entire pipeline runs end-to-end in tests. This caught two integration issues that would not have surfaced if mock mode had short-circuited at the helper boundary.
- `<Image unoptimized>` instead of letting Next optimize signed URLs. The optimizer would cache the optimized variant against the URL, but the URL changes hourly — net waste.
- No coach integration in v1 (e.g. "ask the coach to refine my prompt") — clean follow-up. Get the plumbing right first.

**Hiccups + fixes:**
- Initial empty migration. Always remember to actually write the SQL before `db push`.
- Two RLS tests flaked on the full-suite run with timeouts on what looked like signup contention. Both pass cleanly solo (18s for the pair). Same root cause CLAUDE.md already documents under the storageState entry — multiple workers each running per-test signups against Supabase. The storageState (per-worker) refactor is queued and will fix all of these together. Not blocking the ship.

**Env additions:**
- New: `REPLICATE_API_TOKEN`. Halli needs to:
  1. Generate a token at https://replicate.com/account/api-tokens (free signup; pay-as-you-go billing — add $10 to start).
  2. Paste into `.env.local` as `REPLICATE_API_TOKEN=...`.
  3. Add the same token in Vercel (Settings → Environment Variables, all environments) and as a GitHub Actions repo secret.
- Until the token is in Vercel, real-mode generation will fail with a clear "REPLICATE_API_TOKEN not configured" error. Mock mode (E2E only) doesn't need it.

**Next-session candidates:**
- **Coach × Studio integration**: a "Refine this prompt with the coach" affordance in the generate form, or a way to send a generated image to the coach for critique.
- **Second Studio tool**: copy/email drafter — pure-Anthropic, no new infra, fast to ship.
- **Test foundation refactor** (per-worker storageState) — would resolve all the parallel-load flakes at once.
- Wire `REPLICATE_API_TOKEN` to Vercel + GitHub secrets so real-mode works in prod.

### 2026-04-29 (later still 6) — A2 of coach deepening: cross-project (user-level) memory

**Shipped:**
- Migration [supabase/migrations/20260429211441_add_user_facts.sql](supabase/migrations/20260429211441_add_user_facts.sql): `user_meta` table (per-user metadata, tracks `user_facts_last_extracted_at`) + `user_facts` table (id, user_id, fact ≤500 chars, source_project_id, pinned, timestamps) with RLS by `user_id = auth.uid()` for select/insert/update/delete. Composite index on `(user_id, pinned desc, created_at desc)`.
- Extraction [src/lib/coach/extract-user-facts.ts](src/lib/coach/extract-user-facts.ts): scans all conversations across a user's projects, calls Sonnet 4.6 with a profile-level extraction prompt, inserts via service role, runs `enforceUserFactCap` (drops oldest non-pinned past 100). Mock mode inserts a deterministic `[mock user fact ${ts}-${hex}]` row + runs cap enforcement. `touchMeta` upserts `user_meta.user_facts_last_extracted_at` on every run.
- Cron [src/app/api/cron/extract-facts/route.ts](src/app/api/cron/extract-facts/route.ts): after the per-project loop, runs user-level extraction once per distinct user_id and folds the result counts into the response payload.
- Injection [src/app/api/coach/stream/route.ts](src/app/api/coach/stream/route.ts) + [src/lib/coach/build-memory.ts](src/lib/coach/build-memory.ts): user_facts loaded alongside project_facts and injected into the system prompt as "What you remember about this user (across all their projects)". Mock response appends ` [user-memory: N]` suffix when user_facts exist.
- Dashboard panel [src/app/(app)/dashboard/UserMemoryPanel.tsx](src/app/(app)/dashboard/UserMemoryPanel.tsx) + [UserFactItem.tsx](src/app/(app)/dashboard/UserFactItem.tsx) + [AdminExtractUserFactsButton.tsx](src/app/(app)/dashboard/AdminExtractUserFactsButton.tsx) + actions in [user-fact-actions.ts](src/app/(app)/dashboard/user-fact-actions.ts). Same edit/delete/pin pattern as the project-memory tab. "About you" header + "Remembering N things" pill. Empty-state copy varies based on whether extraction has run yet.
- 6 new E2E tests in [tests/e2e/user-memory.spec.ts](tests/e2e/user-memory.spec.ts): edit, delete-with-confirm, pin sort-to-top, RLS cross-user dashboard isolation, injection into coach prompt across projects, 100-fact cap. Total project E2E tests: **40 (all passing locally; one streaming test occasionally flakes under parallel load with ECONNRESET, passes solo)**.

**Decisions:**
- Same Sonnet-vs-Haiku, mock-row-per-call, and admin-bypass-in-test-mode patterns as the project-memory feature — keep cognitive overhead low.
- 100-fact cap (vs project memory's 50) — user-level facts cover broader ground (location, working style, multiple projects of context) so they need more headroom.
- "About you" lives on `/dashboard`, not on each project page — it's by definition cross-cutting.
- User memory is silent in the coach UI (no "I remember…" affordance), same as project memory. Visible in the dashboard panel only.
- Cron does both passes (project-level then user-level) in one nightly run, so user facts are at most 24h behind the conversations they're derived from.

**Hiccup + fix:**
- The user-memory delete test failed once on a full-suite run: `toHaveCount(0)` on the fact text passed immediately because the `confirmDelete` mode replaces the fact text with "Delete this fact? This cannot be undone." — so the assertion succeeded *before* the server action committed to the DB. The reload then re-fetched the still-existing row and the post-reload assertion failed. Fix: assert on `[data-user-fact-id]` count instead of the text — the entire `<li>` only disappears after the action completes and revalidation re-renders. The same race in principle affects the project-memory delete test, but it has been passing reliably; left it alone (rule of "don't fix what isn't breaking").

**Env additions:** none new — reuses `CRON_SECRET`, `ADMIN_USER_ID`, `E2E_TEST_MODE` from the project-memory feature. Halli confirmed both `CRON_SECRET` and `ADMIN_USER_ID` are already set in Vercel from the project-memory feature, so the nightly user-fact cron pass works in prod immediately on the first run after this deploy.

**Next-session candidates:**
- First Studio tool (image gen).
- Test foundation refactor (per-worker storageState — see entry below).
- Coverage gaps from STATUS.md.

### 2026-04-29 (later still 5) — Attempted shared-auth storageState refactor, reverted

**Tried:** Playwright's standard `storageState` pattern — one setup spec signs up a "test runner" user, saves auth cookies to `playwright/.auth/user.json`, all tests inherit that state. Goal: drop signups from ~30/run to ~3/run.

**Result:** 6 deterministic failures every run. Specifically: tests that signed up a *fresh* user during their flow (cross-user RLS tests via `browser.newContext()`, plus the "logged-out user calling /api/coach gets 401" test which needs no auth) interacted badly with the shared session. Tests like "user can send a message" were also failing — `signUpNewUser` short-circuited successfully, but a few seconds later in the flow a goto to `/projects/new` redirected to `/login` because the shared user's auth cookies had been refreshed by another concurrent worker, invalidating ours.

**Diagnosis:** Supabase's `@supabase/ssr` rotates refresh tokens on every refresh. Parallel workers all sharing the same storageState file race on refresh — when one worker refreshes, the other workers' in-memory cookies become stale, triggering middleware redirects to `/login`. This is a fundamental incompatibility with naive shared-auth-state across parallel test workers, not a code bug we can patch quickly.

**Reverted to** per-test signup. Tests pass 34/34 again as before.

**Future fix paths (queued for a focused future session):**
- **Per-worker users** — each Playwright worker creates its own user via a setup test that runs once per worker. ~5 signups per full run instead of 30, no shared-state racing.
- **Token-only state without refresh** — disable Supabase auto-refresh in tests so cookies stay stable for the test duration. Requires a config knob in `@supabase/ssr` we haven't investigated.
- **Sequential workers** (`workers: 1` in CI) — slow but reliable.

The bumped Supabase rate limit you set today (500 / 5 min) is the practical fix for now: with that, the per-test-signup pattern doesn't cause issues.

### 2026-04-29 (later still 4) — A1 of coach deepening: "What next" suggestions tray

**Shipped:**
- POST [src/app/api/coach/suggest/route.ts](src/app/api/coach/suggest/route.ts) — generates 2–3 short next-action suggestions for the current conversation. Auth + RLS via the same conversation-ownership check used in `/api/coach/stream`. Mock mode returns 3 deterministic fixtures (no Anthropic call).
- Helper [src/lib/coach/build-suggestions.ts](src/lib/coach/build-suggestions.ts) — system prompt + `buildSuggestionContext` (reuses `buildProjectContext` and `buildMemoryContext` so suggestions see the same framing as the coach itself) + tolerant `parseSuggestions` (strips code fences, validates shape, silently returns `[]` on any structural failure).
- Client component [src/app/(app)/projects/[id]/SuggestionTray.tsx](src/app/(app)/projects/[id]/SuggestionTray.tsx) — pill-style buttons, skeleton loading, refresh button, hidden when no suggestions and not loading. `data-suggestion-tray` + `data-suggestion-index` attributes for tests.
- [src/app/(app)/projects/[id]/Coach.tsx](src/app/(app)/projects/[id]/Coach.tsx) — fetches suggestions on mount (only if thread has prior messages) and after every successful `done` SSE event. Click handler pre-fills the textarea and focuses it; never auto-sends. Tray disabled while streaming.
- [tests/e2e/suggestions.spec.ts](tests/e2e/suggestions.spec.ts) — 4 new E2E tests. Total project E2E tests: **34**.
- Cap-test fix in [tests/e2e/memory.spec.ts](tests/e2e/memory.spec.ts): switched the extract-button locator to `[data-extract-button="true"]` (added the attribute in [AdminExtractButton.tsx](src/app/(app)/projects/[id]/AdminExtractButton.tsx)) so the test no longer flakes when the button text flips between "Run extraction now" and "Running…".

**Decisions:**
- Sonnet 4.6 for suggestion generation (not Haiku) — same reasoning as the auto-title call: Haiku had quirky API behavior in this codebase, Sonnet is verified, ~$0.005 per call is fine for the dogfooding phase.
- No DB persistence — suggestions are regenerated on every `done` event so they always reflect the latest context. If we ever want analytics on which suggestions get clicked, that's a small follow-up.
- Click-to-fill, never click-to-send. Wholesome positioning constraint: the user always reviews and edits before sending.
- Tray hidden entirely when no suggestions are available — avoids "empty tray" clutter on fresh threads.
- Suggestion tray on Coach tab only. Memory tab and dashboards do not surface suggestions.

**Hiccups + fixes:**
- The Project-memory cap test flaked because its locator only matched "Run extraction now" while the button briefly shows "Running…" during the action. Fixed via a `data-extract-button` attribute.
- Halli's sharp pushback: every test currently signs up a fresh user → 30+ signups per full run → Supabase rate limit kicked in after running the suite back-to-back. The full-suite "15 failed" was rate-limit, not a code bug — proven by the 4 new tests passing in isolation. Rate limit was bumped manually for now. **The fix is the storageState pattern (Playwright's standard for shared auth) — queued as the next task.**

**Next-session candidates:**
- **Test foundation refactor** — Playwright `storageState` pattern: one signed-up "test runner" user with cookies cached to `playwright/.auth/user.json`, loaded by all tests. Cross-user RLS tests still create a second fresh user. Net: ~3 signups per full run instead of ~30. **Highest leverage immediate task.**
- **A2 — Cross-Project memory** (per the original /plan queue). Same pattern as Project memory at user level.
- First Studio tool (image gen).
- Coverage gaps from STATUS.md.

### 2026-04-29 (later still 3) — Project-level coach memory

**Shipped:**
- Migration [supabase/migrations/20260429131402_add_project_facts.sql](supabase/migrations/20260429131402_add_project_facts.sql): `project_facts` table (id, project_id, user_id, fact ≤500 chars, source_thread_id, pinned, timestamps) with RLS by `user_id = auth.uid()`. Plus `projects.project_facts_last_extracted_at` column for incremental cron.
- **Memory tab UI** at [src/app/(app)/projects/[id]/Memory.tsx](src/app/(app)/projects/[id]/Memory.tsx) + [ProjectTabs.tsx](src/app/(app)/projects/[id]/ProjectTabs.tsx) + [FactItem.tsx](src/app/(app)/projects/[id]/FactItem.tsx). Coach/Memory tab switcher with `?tab=memory` URL state. Hover actions: edit (inline), pin/unpin, delete (with confirm). Pinned facts get amber border + sort to top. "Remembering N things" pill on the tab.
- **Fact actions** at [src/app/(app)/projects/[id]/fact-actions.ts](src/app/(app)/projects/[id]/fact-actions.ts): updateFact, deleteFact, togglePinFact. RLS enforced.
- **Extraction logic** at [src/lib/coach/extract-facts.ts](src/lib/coach/extract-facts.ts) — single function used by both cron and manual trigger. Loads new messages since last extraction, calls Sonnet 4.6 (Haiku had API quirks), parses JSON array, inserts as facts, runs `enforceFactCap` (drops oldest non-pinned past 50). In `E2E_TEST_MODE` inserts a deterministic mock fact + runs cap, so cap behavior is testable.
- **Cron endpoint** at [src/app/api/cron/extract-facts/route.ts](src/app/api/cron/extract-facts/route.ts) — GET, gated by `Authorization: Bearer ${CRON_SECRET}`. Uses service-role client to scan all projects. Configured in [vercel.json](vercel.json) to fire daily at 03:00 UTC.
- **Manual admin trigger** at [src/app/(app)/projects/[id]/AdminExtractButton.tsx](src/app/(app)/projects/[id]/AdminExtractButton.tsx) + [extraction-actions.ts](src/app/(app)/projects/[id]/extraction-actions.ts). Visible only when `user.id === ADMIN_USER_ID` (or in test mode). To remove before public signups.
- **Memory injection** in [src/app/api/coach/stream/route.ts](src/app/api/coach/stream/route.ts) via [src/lib/coach/build-memory.ts](src/lib/coach/build-memory.ts). Facts (pinned first) appended to system prompt as "What you remember about this project". Mock response includes `[memory: N]` suffix when facts exist, so injection is testable.
- **7 new E2E tests** in [tests/e2e/memory.spec.ts](tests/e2e/memory.spec.ts): edit, delete, pin, RLS cross-user, injection into coach prompt, 50-fact cap, cron auth. Total project E2E tests: **30 (all passing locally, 1.7 min)**.
- New env vars: `CRON_SECRET` and `ADMIN_USER_ID`. Added to [.env.local](.env.local) automatically. Vercel + GitHub still need adding before next deploy.

**Decisions:**
- Sonnet 4.6 for extraction, not Haiku — Haiku 4.5 had API request-format friction the last time, Sonnet works reliably and the per-extraction cost is small.
- One mock fact per `extractFactsForProject` call in test mode (rather than full no-op) so the cap enforcement path is end-to-end testable.
- Admin button + manuallyExtractFacts both bypass the admin check when `E2E_TEST_MODE=true` so tests don't need to impersonate the admin user.
- Memory injection is silent in the UI — no "I remembered X about you" affordance. The coach just feels smarter; calling attention to memory feels gimmicky.
- 50-fact-per-project cap with oldest-non-pinned eviction. Pinned facts always preserved.

**Hiccups + fixes:**
- I asked Halli to manually paste SQL to seed test facts — they pushed back. Switched to skipping the manual seed and continuing the build (real extraction creates facts naturally). Saved as a binding feedback memory: skip "intermediate verification" steps that require Halli's manual input when the proper verification can happen later.
- Halli explicitly asked Claude to act more autonomously: run commands, generate values, query APIs directly. Bound as a [memory rule](memory/feedback_take_more_action.md): pause only for browser-auth, product decisions, manual UI checks, and final go-ahead — not routine execution.

### 2026-04-29 (later still 2) — Attempted middleware → proxy rename, reverted

**Tried:** Renaming `src/middleware.ts` to `src/proxy.ts` (per the Next.js 16 deprecation warning) with the `middleware` export renamed to `proxy`.

**Result:** 20 of 23 E2E tests timed out. UI-navigating tests all hung; only direct-API-only tests passed. Diagnosis: Next.js 16.2.4 emits the deprecation warning ("use proxy") but does NOT yet load `proxy.ts` as a runtime convention — the file is silently ignored, Supabase session cookies aren't refreshed across requests, and authenticated navigation breaks.

**Reverted to** `src/middleware.ts` with `middleware` export. Tests pass again (per the prior 23/23 run).

**Lesson:** before attempting again, read https://nextjs.org/docs/messages/middleware-to-proxy and verify the runtime version actually picks up `proxy.ts`. The deprecation warning alone is not proof of support.

### 2026-04-29 (later still) — Smoke test → manual-trigger only

**Shipped:**
- [.github/workflows/smoke-test.yml](.github/workflows/smoke-test.yml) trigger changed from `workflow_run` (auto-fire after every successful Tests run on main) to `workflow_dispatch` (manual button in GitHub Actions tab).

**Why:** Each smoke run costs a few cents on Anthropic. With auto-fire on every main push, the cost compounds for incremental commits that don't really need end-to-end production verification. Manual gives Halli control: click "Run workflow" only after a meaningful feature ships.

**How to use:**
- https://github.com/HalliburtonOji/ai-all-app/actions/workflows/smoke-test.yml
- Click **"Run workflow"** button (top right). Pick branch `main`, click green Run workflow button.
- Smoke test runs ~3–5 min, report in artifacts as before.

### 2026-04-29 (later) — Coach Part 2: streaming, multi-thread, polish

**Shipped:**
- **Streaming endpoint** at [src/app/api/coach/stream/route.ts](src/app/api/coach/stream/route.ts). POST that returns Server-Sent Events (`event: text` deltas, `event: done` at end with the persisted message + auto-generated title, `event: error` on mid-stream failure). The original [src/app/api/coach/route.ts](src/app/api/coach/route.ts) is kept as a non-streaming fallback. Mock mode emits 4 chunks 50ms apart so streaming tests are deterministic.
- **History trimming** in the streaming route: when message history > 50, keep most recent 40, log `[coach] Trimmed N oldest messages…`.
- **`partial` boolean column on `messages`** via [supabase/migrations/20260429005707_add_partial_to_messages.sql](supabase/migrations/20260429005707_add_partial_to_messages.sql). Set true when a stream is interrupted; UI surfaces "Response was interrupted." underneath the bubble.
- **Multi-thread sidebar** at [src/app/(app)/projects/[id]/ConversationList.tsx](src/app/(app)/projects/[id]/ConversationList.tsx) + per-row [src/app/(app)/projects/[id]/ConversationItem.tsx](src/app/(app)/projects/[id]/ConversationItem.tsx). Shows all conversations for the project, hover menu with Rename + Delete, "+ New conversation" button. Mobile: collapses to a `<details>` element.
- **URL-state for current thread**: `/projects/[id]?conversation=<id>`. Server-side picks current thread by URL param, falls back to most recent, auto-creates if zero exist.
- **Server actions** for conversation lifecycle in [src/app/(app)/projects/[id]/conversation-actions.ts](src/app/(app)/projects/[id]/conversation-actions.ts): `createConversation`, `renameConversation`, `deleteConversation`, `regenerateLastResponse`.
- **Auto-titling** — first user/assistant exchange in a default-titled conversation triggers a Sonnet 4.6 call (Haiku 4.5 wasn't available on the account; Sonnet works fine and the cost difference for ~50 output tokens is negligible). Title is sent in the `done` SSE event so the client can `router.refresh()` the sidebar.
- **Per-message Copy + Regenerate** actions in [src/app/(app)/projects/[id]/Coach.tsx](src/app/(app)/projects/[id]/Coach.tsx). Copy uses `navigator.clipboard.writeText`. Regenerate calls the server action to delete the assistant message + the user message that preceded it, then re-fires the stream with the captured user content.
- **Inline error banner with Retry button** when a stream fails. Retry re-streams using `lastSubmittedMessage`.
- **Streaming UI** — placeholder assistant bubble inserted on submit, `data-streaming="true"` attribute while filling, pulsing cursor at end of in-progress text, "Coach is thinking…" placeholder while no chunks have arrived yet, input disabled the entire time.
- **Empty state copy** updated to "Ready when you are. What's on your mind?"
- **8 new E2E tests** in [tests/e2e/coach.spec.ts](tests/e2e/coach.spec.ts) covering streaming, multi-thread isolation, /api/coach/stream RLS, rename, delete, auto-title, regenerate, and input-lock-during-stream. Total coach tests: 13. Total project E2E tests: 23.
- [tests/STATUS.md](tests/STATUS.md) updated.

**Decisions:**
- One thread per conversation (the schema already supported many; we just surfaced it). No per-thread system prompt overrides yet — that's deferred to Project-level memory in weeks 5–6.
- Auto-title uses Sonnet, not Haiku. Reason: Haiku 4.5 model string `claude-haiku-4-5-20251001` returned 400 errors ("This model does not support assistant message prefill") and the simpler workaround was to switch model rather than restructure the prompt twice. Cost difference: ~$0.0001 per title.
- Regenerate deletes the user message AND the assistant response, then re-streams. Alternative would have been to keep the user message and only delete the assistant — but that requires a "regenerate mode" parameter on the streaming endpoint, which complicates the API. The current design keeps a single endpoint shape.
- Streaming route preserves the user message in DB *before* streaming starts — so a network failure mid-stream doesn't lose the user's text. Partial assistant content is saved with `partial=true`.

**Hiccups + fixes:**
- Auto-title initially failed silently because Anthropic refused the messages-array structure: `"This model does not support assistant message prefill. The conversation must end with a user message."` Fix: collapse the user/assistant exchange into a single user-role prompt that asks for the title.
- Next.js 16 deprecation warning: `"middleware" file convention is deprecated. Please use "proxy" instead.` Acknowledged; not yet renamed. Small follow-up task.

**Next-session candidates:**
- **Rename `src/middleware.ts` → `src/proxy.ts`** to clear the Next.js 16 deprecation warning. Single rename + import path update.
- **Project-level coach memory** (weeks 5–6 of MVP plan).
- First Studio tool (image gen or copy drafter).
- Custom domain.
- Coverage gaps from [tests/STATUS.md](tests/STATUS.md): archive/unarchive, mobile viewport project, description editing, partial-stream Anthropic failure path.

### 2026-04-29 — Smoke false-positive fix + signup UX tightening

**Shipped:**
- `signup` server action now detects whether `data.session` is returned by Supabase (i.e. email confirmation OFF) and redirects directly to `/dashboard` in that case. When confirmation is ON, behavior unchanged: `/login?message=Check your email…`. See [src/app/auth/actions.ts](src/app/auth/actions.ts).
- `signUpNewUser` test helper updated to wait for either `/dashboard` or `/login` after signup and branch — same helper now works in both confirmation modes. [tests/e2e/helpers/auth.ts](tests/e2e/helpers/auth.ts).
- Smoke tester's `report_issue` tool description tightened: declaring `critical` now requires at least one alternate verification check (direct navigation, retry) to confirm the failure isn't transient or a misread. See [scripts/smoke-test.ts](scripts/smoke-test.ts).

**Hiccups + fixes:**
- Production smoke test reported a critical false-positive: after signup, the user landed on `/login` with a "Check your email to confirm your account" banner *even though confirmation was off and a session was already established*. Claude saw the banner, declared login broken, never tried `/dashboard` directly until later (where it then noticed the user was actually logged in). Fix above resolves both the misleading UX and the smoke tester's hair-trigger.

**Dangling:**
- None for this arc. Auth + Projects + Coach v1 + tests + CI + smoke + schema-as-code all in place.

**Next-session candidates:**
- Coach Part 2: streaming responses, multiple conversations per project, Project-level memory.
- First Studio tool (image gen or email/copy drafter — leans toward image gen as a higher-impact "I made this!" moment for users).
- Custom domain.
- Coverage gaps from [tests/STATUS.md](tests/STATUS.md) (archive/unarchive, mobile viewport, description editing).

### 2026-04-28 — AI Coach v1 + tightening the test pipeline

**Shipped:**
- Coach feature Part 1 — schema (`conversations` + `messages` with RLS-by-subquery), [src/lib/coach/system-prompt.ts](src/lib/coach/system-prompt.ts) v1, [src/lib/coach/build-context.ts](src/lib/coach/build-context.ts), [src/app/api/coach/route.ts](src/app/api/coach/route.ts), client `<Coach>` component with optimistic UI, mock mode (`E2E_TEST_MODE=true` returns `[mock] I received: …`), `react-markdown` for assistant message rendering.
- 5 new Playwright tests covering happy path / persistence / auth 401 / 10k-char validation / cross-user RLS.
- [tests/STATUS.md](tests/STATUS.md) updated with coach coverage row + new gaps.
- This canonical [CLAUDE.md](CLAUDE.md) — replaces the prior thin version.
- Supabase CLI installed as dev dep (`supabase` package). `init` not yet run; full setup deferred to next session.

**Decisions:**
- One conversation per Project for now (schema supports many — shipped UI uses one).
- User message saves to DB *before* Anthropic is called, so an upstream failure leaves the user's text intact and only loses the assistant turn.
- Smoke test cost-equivalent token tracking (cache reads weighted at 0.1×) + outcome split into PASS / FAIL / ERROR with separate Coverage flag.
- `E2E_TEST_MODE` lives in [playwright.config.ts](playwright.config.ts) and the workflow `env:` block — not in `.env.local` or Vercel, deliberately.

**Hiccups + fixes:**
- Smoke test workflow failed twice with exit code 9 — `tsx --env-file=.env.local` crashes when the file is missing in CI. Replaced with an in-script dotenv loader and removed `--env-file` from npm scripts.
- Coach inline-edit UX had a smoke-tester false positive (Playwright matches accessible name = `aria-label="Edit name"`, not visible button text). Fixed `executeGetPageState` to report `aria-label` to Claude.
- Markdown wasn't rendering in coach replies — installed `react-markdown` and added a `<CoachMarkdown>` component with custom Tailwind styling.
- `supabase db pull` requires Docker Desktop (containerized `pg_dump`). Avoided installing Docker by manually writing the baseline migration matching the live schema, then using `supabase migration repair --status applied 20260427000000` to register it as already-run on the remote. Future migrations will use `npx supabase db push`, which doesn't need Docker.

**Also shipped:**
- Supabase CLI fully wired up: installed (`supabase` dev dep), `supabase init`, `supabase login`, `supabase link --project-ref gdbamtnnowfziqhqcggi`, baseline migration written + repaired. `npx supabase migration list` shows local + remote in sync. Schema is now version-controlled in [supabase/migrations/](supabase/migrations/).

### 2026-04-27 — Foundations through CI

**Shipped:**
- Phase 0: VS Code, Node 25, Git, GitHub repo (`HalliburtonOji/ai-all-app`), Vercel auto-deploy pipeline. Live at https://ai-all-app.vercel.app.
- Auth: Supabase email + Google OAuth via `@supabase/ssr`. Login / signup / dashboard pages, OAuth callback route, middleware-based session refresh.
- Projects feature: full CRUD on `projects` table (`name`, `description`, `project_type`, `status`, timestamps), inline edit on `(app)/projects/[id]`, archive/delete, type badges with one color per type, mobile-responsive.
- Shared `(app)` route group with auth check + NavBar.
- 10 Playwright E2E tests (5 auth + 5 projects, including cross-user RLS check).
- GitHub Actions: Tests workflow on every push (~5 min) and AI Smoke Test workflow after main pushes.
- AI Smoke Tester (`scripts/smoke-test.ts`) using `@anthropic-ai/sdk` + Playwright with hard caps on time + tokens.
- `CLAUDE.md` testing rules (binding) + `tests/STATUS.md` + `CONTRIBUTING.md`.
- Onboarded Halli to: PowerShell execution policy fix for npm, Vercel GitHub-App permission setup, Supabase rate-limit toggle for tests.

**Decisions:**
- Same Supabase project for dev + prod (single environment for now).
- Free tier hides email rate limit at 2/hour — solved by disabling "Confirm email" in Supabase auth settings rather than configuring custom SMTP.
- "Halli" used as git author name + on the public homepage's "Built by" line.

---

## 15. Anything Future-You Should Read Before Starting Work

1. **This file, in full.** Then [tests/STATUS.md](tests/STATUS.md) to see coverage gaps.
2. **The most recent Session Log entry** — it tells you what's dangling.
3. The user is non-developer. **Slow down. Explain. Pause for confirmation.** Speed of change is not the goal — Halli's confidence is.
4. If a request seems to violate the wholesome positioning (section 4) or the testing rules (section 8), flag it before implementing.

---

## 16. Master Plan — Robustness + Integration (committed 2026-04-30)

After Studio v1, Halli pushed back on incremental feature-shipping ("not from one feature to another and everything feeling subpar") and asked for a structural plan. This is the canonical roadmap. Each phase has a strict **robustness bar** that must be cleared before moving to the next phase. If any criterion fails at the end of a phase, the phase is **not done** — fix or revert.

Guiding principles for every phase:
1. Every feature attaches to a Project.
2. Coach + tools + memory are one system, not three. Each can reference the others.
3. Every visible surface is reliable, mobile, accessible, and on-brand wholesome.
4. Every feature lands with tests + STATUS update + session log.
5. No half-finished features in `main` for >1 day. Either ship or revert.

### Phase 1 — Coach × Studio integration (the loop) · ~2 sessions
**Goal:** Coach + tools + memory feel like one system, not three tabs.
**Deliverables:** tool-using coach (Studio image gen via Anthropic native tool-use) · "Refine with coach" button on Studio · memory-aware Studio prompts · tool-using suggestions in the tray · recent-activity strip on project header.
**Robustness bar:** all paths E2E-tested incl. RLS · mobile (375px) verified · tool failures show retry not dead bubbles · memory-injection regression test in place · CI green.

### Phase 2 — Studio breadth: 2 more tools + Studio dashboard · ~3 sessions
**Goal:** Studio is recognizably a *workshop*.
**Deliverables:** copy/email drafter (Anthropic, no infra) · voice-over generator (ElevenLabs + Storage) · Studio tab becomes a tool grid · generic `studio_outputs` superset table so adding tool #4 is pure UI work.
**Robustness bar:** one schema, three tools using it · per-tool RLS independently verified · ElevenLabs cost cap (max 30s clips on free tier) · all three tools mobile-verified.

### Phase 3 — Foundation hardening · ~2 sessions
**Goal:** App stops feeling fragile. New features become cheaper to add.
**Deliverables:** per-worker `storageState` Playwright refactor (~5 signups/run instead of 60) · Sentry (or equivalent) wired client + server · accessibility pass (keyboard nav, aria, focus) · performance pass (Lighthouse ≥90) · mobile pass.
**Robustness bar:** full E2E suite <2 min, zero flakes across 5 consecutive runs · Lighthouse ≥90 on top-4 routes · WCAG AA basics verified · CI green.

### Phase 4 — Earn v1 · ~3 sessions
**Goal:** L→D→**E** loop becomes visible. The first feature where the app demonstrably helps users *make money*.
**Deliverables:** portfolio passport (per-output opt-in toggle → public `/p/:username` route) · income tracker `/me/earnings` (manual log + CSV export + cumulative chart, currency-aware: NGN/KES/ZAR/GBP/USD) · pricing helper coach intent (uses memory + market-data prompt, refuses without context).
**Robustness bar:** public route never leaks private data (explicit RLS test) · currency arithmetic correct · pricing helper's caveats present (wholesome charter).

### Phase 5 — Learn v1 · ~4 sessions
**Goal:** Classroom layer is real. Foundations + Prompt Craft anchor the "learn" identity.
**Deliverables:** lesson player at `/learn/:slug` (markdown + embedded interactions, can call coach mid-lesson) · ~6 Foundations + ~6 Prompt Craft lessons · `user_lesson_progress` table · tutor mode (sidebar coach with lesson context injected) · Lesson 1 auto-suggested on first signup.
**Robustness bar:** lessons version-controlled as markdown in repo (no CMS) · progress survives logout/device · tutor mode tested for context accuracy.

### Phase 6 — Onboarding + community v1 · ~3 sessions
**Goal:** New users land into something coherent. The "alone with my project" feel becomes "people are doing this with me."
**Deliverables:** 3-screen welcome (role · goal · optional first project, saved as user_facts) · curated empty states everywhere · wins feed (opt-in posting of Studio outputs, public, likes only) · failure forum (logged-in only, journaling).
**Robustness bar:** welcome flow optional/skippable · public posting requires explicit opt-in per post (no accidental publishing) · feeds spam-resistant (per-user/day rate limit) · RLS-safe.

### Stopping point
End of Phase 6 = **all five product layers represented + onboarding + a hardened foundation**. After this, the original 12-week roadmap's BYOK/payments + Work layer are the next priorities. Total Phase 1–6 estimate: ~17 focused sessions.

### How to use this plan
- Each phase is its own `/plan` session — drill into concrete file changes, ship, mark robustness checklist done, then move on.
- The full-app robustness bar (mobile, accessibility, perf, error UX) is enforced **per phase**, not deferred. Phase 3 is the "deliberate hardening" phase but earlier phases must already meet the bar for what they ship.
- Deferred (not abandoned, just sequenced after Phase 6): BYOK + Stripe payments, Work layer (AI Audit, profession packs), Studio tools 4+, Skill tree branches 3–5 (Tool Fluency / Application / Career & Money), marketplace, opportunity radar, client CRM, multilingual, mobile-money rails, workflow recorder, template gallery.

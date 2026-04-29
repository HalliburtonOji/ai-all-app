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
| **Production Smoke Test** | After every successful Tests run on `main`, [.github/workflows/smoke-test.yml](.github/workflows/smoke-test.yml) runs [scripts/smoke-test.ts](scripts/smoke-test.ts) — Claude drives Playwright through real user journeys against the live deploy. Reports as a workflow artifact. | `main` branch only. |
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

-- ============================================================
-- Phase 8 — Work layer: AI Audit of My Job
-- ============================================================
--
-- Per-user audits of their career: what they do, what worries them
-- about AI, what they hope, plus an AI-generated personalised report
-- (the "summary" column). Cross-cutting (not project-scoped) because
-- it's about the human, not a specific project.
--
-- Owner-only RLS across all CRUD. Hard length caps on every text
-- field so a runaway client can't pile up huge rows.

create table public.job_audits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_title text not null check (
    char_length(job_title) > 0 and char_length(job_title) <= 200
  ),
  responsibilities text null check (
    responsibilities is null or char_length(responsibilities) <= 2000
  ),
  top_tasks text null check (
    top_tasks is null or char_length(top_tasks) <= 2000
  ),
  worries text null check (
    worries is null or char_length(worries) <= 2000
  ),
  hopes text null check (
    hopes is null or char_length(hopes) <= 2000
  ),
  -- The AI-generated personalised report. Plain text (markdown).
  -- Null while in flight; populated after the generation call.
  summary text null check (
    summary is null or char_length(summary) <= 20000
  ),
  -- The model that generated the summary, e.g. "claude-sonnet-4-6",
  -- "claude-sonnet-4-6-byok", or "mock-audit".
  model text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.job_audits enable row level security;

create policy "Users can view own job audits"
  on public.job_audits for select
  using (auth.uid() = user_id);

create policy "Users can insert own job audits"
  on public.job_audits for insert
  with check (auth.uid() = user_id);

create policy "Users can update own job audits"
  on public.job_audits for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own job audits"
  on public.job_audits for delete
  using (auth.uid() = user_id);

create index job_audits_user_created_idx
  on public.job_audits(user_id, created_at desc);

-- Trigger: keep updated_at fresh on every UPDATE.
create or replace function public.touch_job_audits_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger job_audits_touch_updated_at
  before update on public.job_audits
  for each row execute function public.touch_job_audits_updated_at();

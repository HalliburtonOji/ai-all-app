-- ============================================================
-- Phase 12 — Workflow chains v1
-- ============================================================
--
-- A workflow chain is a saved sequence of 2-5 text-drafter steps.
-- Each step has a prompt_template with {{input}} and
-- {{previous_output}} placeholders. Running a chain pipes the user's
-- input through each step in order; each step's output becomes the
-- next step's {{previous_output}}.
--
-- Steps are stored as a JSONB array on the chain row (not a separate
-- table) — they're a small fixed shape, never queried independently,
-- and tightly coupled to the chain's lifecycle. Less plumbing.

create table public.workflow_chains (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null check (
    char_length(name) > 0 and char_length(name) <= 100
  ),
  description text null check (
    description is null or char_length(description) <= 500
  ),
  -- steps shape: [{ order: int, kind_hint: text, prompt_template: text }]
  -- Validated at the application layer; we just enforce array-shape here.
  steps jsonb not null default '[]'::jsonb
    check (jsonb_typeof(steps) = 'array' and jsonb_array_length(steps) <= 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workflow_chains enable row level security;

create policy "Users can view own workflow chains"
  on public.workflow_chains for select
  using (auth.uid() = user_id);

create policy "Users can insert own workflow chains"
  on public.workflow_chains for insert
  with check (auth.uid() = user_id);

create policy "Users can update own workflow chains"
  on public.workflow_chains for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own workflow chains"
  on public.workflow_chains for delete
  using (auth.uid() = user_id);

create index workflow_chains_project_idx
  on public.workflow_chains(project_id, created_at desc);

-- updated_at trigger.
create or replace function public.touch_workflow_chains_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger workflow_chains_touch_updated_at
  before update on public.workflow_chains
  for each row execute function public.touch_workflow_chains_updated_at();

-- ============================================================
-- Phase 17 — Workflow run history
-- ============================================================
--
-- Each row records one execution of a workflow chain. Inputs +
-- step results are stored as JSONB so the UI can replay them
-- without re-running the chain. Step results reference the
-- studio_outputs rows that were created during the run; deleting
-- one of those outputs is fine (the JSONB just holds an id, no
-- FK), the run row remains as historical record.
--
-- We intentionally do NOT FK-link to workflow_chains here. If a
-- chain gets deleted later we still want the runs visible as
-- "from a deleted chain (Notes → tweet thread)" — the chain_name
-- column captures that label at run time.

create table public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  chain_id uuid null,
  chain_name text not null check (
    char_length(chain_name) > 0 and char_length(chain_name) <= 100
  ),
  input text not null check (
    char_length(input) > 0 and char_length(input) <= 8000
  ),
  -- step_results shape: [{ order: int, kind_hint: text, output_id: uuid|null,
  --                        content_text: text|null, error: text|null }]
  step_results jsonb not null default '[]'::jsonb
    check (jsonb_typeof(step_results) = 'array'),
  status text not null default 'completed'
    check (status in ('completed', 'failed')),
  created_at timestamptz not null default now()
);

alter table public.workflow_runs enable row level security;

create policy "Users can view own workflow runs"
  on public.workflow_runs for select
  using (auth.uid() = user_id);

create policy "Users can insert own workflow runs"
  on public.workflow_runs for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own workflow runs"
  on public.workflow_runs for delete
  using (auth.uid() = user_id);

create index workflow_runs_chain_idx
  on public.workflow_runs(chain_id, created_at desc);

create index workflow_runs_project_idx
  on public.workflow_runs(project_id, created_at desc);

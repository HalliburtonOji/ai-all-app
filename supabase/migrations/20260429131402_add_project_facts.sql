-- ============================================================
-- Project-level coach memory
-- ============================================================
--
-- Each project gets a list of "facts" the coach remembers across all
-- threads in that project. Facts are extracted nightly from recent
-- conversations by a cron job; users can edit, pin, or delete them.
-- Facts are injected into the system prompt for every coach message
-- in that project.
--

-- 1. Track when the extractor last ran for each project, so the cron
--    can find projects with new messages incrementally.
alter table public.projects
  add column project_facts_last_extracted_at timestamptz;

-- 2. The facts table.
create table public.project_facts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  fact text not null check (char_length(fact) > 0 and char_length(fact) <= 500),
  source_thread_id uuid references public.conversations(id) on delete set null,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Index for fast retrieval: pinned facts first, then most recent.
create index project_facts_project_pinned_created_idx
  on public.project_facts(project_id, pinned desc, created_at desc);

-- 4. Reuse the existing set_updated_at() trigger function from the baseline.
create trigger project_facts_set_updated_at
  before update on public.project_facts
  for each row
  execute function public.set_updated_at();

-- 5. RLS — users can only touch their own facts.
alter table public.project_facts enable row level security;

create policy "Users can view own facts"
  on public.project_facts for select
  using (auth.uid() = user_id);

create policy "Users can insert own facts"
  on public.project_facts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own facts"
  on public.project_facts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own facts"
  on public.project_facts for delete
  using (auth.uid() = user_id);

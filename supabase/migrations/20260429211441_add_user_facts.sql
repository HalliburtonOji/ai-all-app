-- ============================================================
-- User-level (cross-project) coach memory
-- ============================================================
--
-- Profile-level facts the coach knows about the user across ALL their
-- Projects ("user is based in London", "user prefers concise responses").
-- Distinct from `project_facts` which are scoped to a single Project.
--
-- Extracted by the same nightly cron, in a separate pass that scans all
-- of a user's conversations for cross-project patterns.

-- 1. Per-user metadata table (single-row-per-user). Tracks when user-fact
--    extraction last ran. Future user-level meta can land here too.
create table public.user_meta (
  user_id uuid primary key references auth.users(id) on delete cascade,
  user_facts_last_extracted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger user_meta_set_updated_at
  before update on public.user_meta
  for each row
  execute function public.set_updated_at();

alter table public.user_meta enable row level security;

create policy "Users can view own meta"
  on public.user_meta for select
  using (auth.uid() = user_id);

-- Insert/update via service role only (the cron). Users don't manage
-- their meta row directly; no insert/update RLS policies needed.

-- 2. The user_facts table.
create table public.user_facts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fact text not null check (char_length(fact) > 0 and char_length(fact) <= 500),
  source_project_id uuid references public.projects(id) on delete set null,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index user_facts_user_pinned_created_idx
  on public.user_facts(user_id, pinned desc, created_at desc);

create trigger user_facts_set_updated_at
  before update on public.user_facts
  for each row
  execute function public.set_updated_at();

alter table public.user_facts enable row level security;

create policy "Users can view own user facts"
  on public.user_facts for select
  using (auth.uid() = user_id);

create policy "Users can insert own user facts"
  on public.user_facts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own user facts"
  on public.user_facts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own user facts"
  on public.user_facts for delete
  using (auth.uid() = user_id);

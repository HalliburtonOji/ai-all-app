-- ============================================================
-- Phase 5 — Learn v1: per-user lesson progress
-- ============================================================
--
-- One row per (user, lesson_slug). Status = 'started' | 'completed'.
-- The slug is stored as plain text (not a FK to a lessons table) —
-- lessons live as markdown in the repo, not in the DB.
--
-- A user with no row for a given slug is considered "not started".

create table public.user_lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_slug text not null check (
    char_length(lesson_slug) > 0 and char_length(lesson_slug) <= 200
  ),
  status text not null default 'started'
    check (status in ('started', 'completed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_slug)
);

alter table public.user_lesson_progress enable row level security;

create policy "Users can view own lesson progress"
  on public.user_lesson_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own lesson progress"
  on public.user_lesson_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own lesson progress"
  on public.user_lesson_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own lesson progress"
  on public.user_lesson_progress for delete
  using (auth.uid() = user_id);

create index user_lesson_progress_user_idx
  on public.user_lesson_progress(user_id, updated_at desc);

-- Trigger: keep updated_at fresh on every UPDATE.
create or replace function public.touch_user_lesson_progress_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_lesson_progress_touch_updated_at
  before update on public.user_lesson_progress
  for each row execute function public.touch_user_lesson_progress_updated_at();

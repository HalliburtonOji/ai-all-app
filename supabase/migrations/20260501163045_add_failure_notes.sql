-- ============================================================
-- Phase 6c — Failure forum
-- ============================================================
--
-- Logged-in-only journal of things that didn't work. Reflective,
-- not boastful — the wholesome counterweight to the wins feed.
--
-- Anyone authenticated can read all notes (it's a community feed,
-- but auth-gated to keep it from being indexable / spam-prone).
-- Owner can insert/update/delete their own. Daily rate limit
-- (max 5/day per user) is enforced server-side in the action.

create table public.failure_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (
    char_length(body) > 0 and char_length(body) <= 2000
  ),
  created_at timestamptz not null default now()
);

alter table public.failure_notes enable row level security;

create policy "Authenticated users can view all failure notes"
  on public.failure_notes for select
  using (auth.uid() is not null);

create policy "Users can post their own failure notes"
  on public.failure_notes for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own failure notes"
  on public.failure_notes for delete
  using (auth.uid() = user_id);

create index failure_notes_created_idx
  on public.failure_notes(created_at desc);
create index failure_notes_user_created_idx
  on public.failure_notes(user_id, created_at desc);

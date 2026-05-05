-- ============================================================
-- Phase 31 — Path-mate matching v1
-- ============================================================
--
-- A "path mate" is someone on a similar path (designer working with AI,
-- writer building an audience, indie hacker shipping their first SaaS,
-- etc). v1 is discovery-only — opt-in profile + tag-based browse.
-- No messaging, no follow, no notifications. Users find each other and
-- reach out via the public portfolio /p/<username> route.
--
-- Per-user; one row max. The public is_public flag controls whether the
-- signal shows on /community/mates. Default false — explicit opt-in
-- every time.

create table public.path_mate_signals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  path text not null check (
    char_length(path) > 0 and char_length(path) <= 100
  ),
  bio text null check (bio is null or char_length(bio) <= 500),
  tags text[] not null default '{}'::text[]
    check (array_length(tags, 1) is null or array_length(tags, 1) <= 8),
  is_public boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.path_mate_signals enable row level security;

-- Owner reads + writes their own signal.
create policy "Users can view own path-mate signal"
  on public.path_mate_signals for select
  using (auth.uid() = user_id);

create policy "Users can insert own path-mate signal"
  on public.path_mate_signals for insert
  with check (auth.uid() = user_id);

create policy "Users can update own path-mate signal"
  on public.path_mate_signals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own path-mate signal"
  on public.path_mate_signals for delete
  using (auth.uid() = user_id);

-- Authenticated users can SEE other people's signals when is_public.
-- Anonymous viewers are intentionally excluded — this is a community
-- feature gated behind sign-up.
create policy "Authenticated can view public path-mate signals"
  on public.path_mate_signals for select
  using (auth.role() = 'authenticated' and is_public = true);

create or replace function public.touch_path_mate_signals_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger path_mate_signals_touch_updated_at
  before update on public.path_mate_signals
  for each row execute function public.touch_path_mate_signals_updated_at();

create index path_mate_signals_public_idx
  on public.path_mate_signals(is_public, updated_at desc)
  where is_public = true;

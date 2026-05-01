-- ============================================================
-- Phase 6b — Wins feed
-- ============================================================
--
-- Likes on Studio outputs that have been opted into the portfolio
-- (is_public = true). The wins feed at /wins is the aggregated public
-- feed across all users — anyone can read (anon included) so counts
-- can render without auth. Authenticated users can add/remove their
-- own like.

create table public.output_likes (
  id uuid primary key default gen_random_uuid(),
  output_id uuid not null references public.studio_outputs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (output_id, user_id)
);

alter table public.output_likes enable row level security;

-- Anyone (anon role included) can read like rows. Counts are part of
-- the public feed UI; the user_id field is incidental but not
-- sensitive.
create policy "Anyone can view output likes"
  on public.output_likes for select
  using (true);

create policy "Users can like outputs"
  on public.output_likes for insert
  with check (auth.uid() = user_id);

create policy "Users can unlike their own likes"
  on public.output_likes for delete
  using (auth.uid() = user_id);

-- Index for "how many likes does this output have" lookups.
create index output_likes_output_idx
  on public.output_likes(output_id);
-- Index for "did this user already like this output" lookup.
create index output_likes_user_output_idx
  on public.output_likes(user_id, output_id);

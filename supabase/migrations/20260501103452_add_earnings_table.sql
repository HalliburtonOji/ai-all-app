-- ============================================================
-- Phase 4b — Income tracker
-- ============================================================
--
-- Manual log of money the user has made through their projects.
-- Currency-aware (per-row), no FX conversion at v1: each entry has
-- its own currency, totals shown per currency.
--
-- amount_cents stored as bigint to avoid float arithmetic on money.
-- A NGN value of 100,000 NGN = 100_000 * 100 = 10_000_000 cents.
-- Display layer divides by 100 and formats with the row's currency.

create table public.earnings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Optional pointer to the project that earned this. Set null when
  -- a project is deleted so the entry doesn't disappear.
  project_id uuid null references public.projects(id) on delete set null,
  amount_cents bigint not null check (amount_cents > 0),
  currency text not null check (currency in ('NGN', 'KES', 'ZAR', 'GBP', 'USD')),
  source text not null check (char_length(source) > 0 and char_length(source) <= 200),
  occurred_on date not null,
  note text null check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now()
);

alter table public.earnings enable row level security;

create policy "Users can view own earnings"
  on public.earnings for select
  using (auth.uid() = user_id);

create policy "Users can insert own earnings"
  on public.earnings for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own earnings"
  on public.earnings for delete
  using (auth.uid() = user_id);

create index earnings_user_occurred_idx
  on public.earnings(user_id, occurred_on desc);

-- ============================================================
-- Phase 32 — Marketplace primitives v1
-- ============================================================
--
-- Listing + discovery only. No payments at v1, no escrow, no fees.
-- Sellers post what they offer (services, deliverables, mentoring,
-- whatever). Buyers browse + reach out via the seller's public
-- portfolio (/p/<username>). Status enum lets sellers draft, list,
-- pause, or close. Listings are auth-required for browsing — same
-- gating as failures + path-mates.

create table public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (
    char_length(title) > 0 and char_length(title) <= 120
  ),
  summary text not null check (
    char_length(summary) > 0 and char_length(summary) <= 600
  ),
  body text null check (body is null or char_length(body) <= 4000),
  -- Free-form for v1: "Starting at $500", "Pay-what-feels-right",
  -- "Email for a quote". No structured pricing column yet.
  price_text text null check (price_text is null or char_length(price_text) <= 80),
  tags text[] not null default '{}'::text[]
    check (array_length(tags, 1) is null or array_length(tags, 1) <= 8),
  status text not null default 'active'
    check (status in ('draft', 'active', 'paused', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.marketplace_listings enable row level security;

-- Owner reads own listings regardless of status.
create policy "Users can view own marketplace listings"
  on public.marketplace_listings for select
  using (auth.uid() = user_id);

create policy "Users can insert own marketplace listings"
  on public.marketplace_listings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own marketplace listings"
  on public.marketplace_listings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own marketplace listings"
  on public.marketplace_listings for delete
  using (auth.uid() = user_id);

-- Authenticated viewers can SEE active listings from anyone. Draft,
-- paused, and closed listings stay private.
create policy "Authenticated can view active marketplace listings"
  on public.marketplace_listings for select
  using (auth.role() = 'authenticated' and status = 'active');

create or replace function public.touch_marketplace_listings_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger marketplace_listings_touch_updated_at
  before update on public.marketplace_listings
  for each row execute function public.touch_marketplace_listings_updated_at();

create index marketplace_listings_active_idx
  on public.marketplace_listings(status, updated_at desc)
  where status = 'active';

create index marketplace_listings_user_idx
  on public.marketplace_listings(user_id, created_at desc);

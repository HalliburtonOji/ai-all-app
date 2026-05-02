-- ============================================================
-- Phase 9 — Client CRM v1
-- ============================================================
--
-- Per-user client roster for freelancers + people doing client work.
-- Cross-cutting (per-user, not project-scoped) so a client that spans
-- multiple Projects shows up as one row. Earnings can optionally link
-- to a client; deleting a client nulls the FK rather than the row.

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (
    char_length(name) > 0 and char_length(name) <= 200
  ),
  email text null check (
    email is null or char_length(email) <= 200
  ),
  company text null check (
    company is null or char_length(company) <= 200
  ),
  status text not null default 'active'
    check (status in ('active', 'paused', 'past')),
  notes text null check (
    notes is null or char_length(notes) <= 4000
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clients enable row level security;

create policy "Users can view own clients"
  on public.clients for select using (auth.uid() = user_id);
create policy "Users can insert own clients"
  on public.clients for insert with check (auth.uid() = user_id);
create policy "Users can update own clients"
  on public.clients for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "Users can delete own clients"
  on public.clients for delete using (auth.uid() = user_id);

create index clients_user_status_idx
  on public.clients(user_id, status, created_at desc);

-- updated_at trigger.
create or replace function public.touch_clients_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger clients_touch_updated_at
  before update on public.clients
  for each row execute function public.touch_clients_updated_at();

-- Optional linkage from earnings to a client. Nullable; on client
-- delete the FK becomes null but the earning row survives.
alter table public.earnings
  add column client_id uuid null references public.clients(id) on delete set null;

create index earnings_client_idx on public.earnings(client_id);

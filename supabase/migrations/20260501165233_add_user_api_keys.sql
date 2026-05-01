-- ============================================================
-- Phase 7 — BYOK (Bring Your Own Keys)
-- ============================================================
--
-- One row per (user, provider). Stores the user's own API key for an
-- AI provider, AES-256-GCM encrypted at rest. Decryption happens
-- server-side using a key derived from SUPABASE_SERVICE_ROLE_KEY
-- (which never reaches the browser).
--
-- The provider list is hard-capped via a check constraint so a typo
-- in app code can't write garbage values. The unique (user_id,
-- provider) constraint means saving a new key for the same provider
-- replaces the old one (via ON CONFLICT in the action).

create table public.user_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (
    provider in ('anthropic', 'replicate', 'elevenlabs', 'openai')
  ),
  -- The three pieces of an AES-256-GCM ciphertext, all stored as
  -- base64. Decoded + decrypted server-side at use time.
  ciphertext text not null,
  iv text not null,
  auth_tag text not null,
  -- Optional friendly label so a user with multiple machines can tell
  -- their keys apart in the UI later.
  label text null check (label is null or char_length(label) <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

alter table public.user_api_keys enable row level security;

create policy "Users can view own api keys"
  on public.user_api_keys for select
  using (auth.uid() = user_id);

create policy "Users can insert own api keys"
  on public.user_api_keys for insert
  with check (auth.uid() = user_id);

create policy "Users can update own api keys"
  on public.user_api_keys for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own api keys"
  on public.user_api_keys for delete
  using (auth.uid() = user_id);

create index user_api_keys_user_idx
  on public.user_api_keys(user_id);

-- Trigger: keep updated_at fresh on every UPDATE.
create or replace function public.touch_user_api_keys_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_api_keys_touch_updated_at
  before update on public.user_api_keys
  for each row execute function public.touch_user_api_keys_updated_at();

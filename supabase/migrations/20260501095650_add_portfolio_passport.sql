-- ============================================================
-- Phase 4a — Portfolio passport
-- ============================================================
--
-- Per-output opt-in: users mark Studio outputs as public, then
-- the public route /p/[username] shows them to anyone (no auth).
-- Default is private — nothing is exposed unless the user explicitly
-- toggles it on.
--
-- Username for the URL is derived from the email prefix at render
-- time (sanitized lowercase alphanumeric+underscore). Collisions are
-- handled by appending a -<short_id> suffix when needed; we look up
-- the auth.users table by email pattern in the page route.
-- (No new username column; keeps the migration scope tight.)

-- 1. Add is_public boolean to studio_outputs.
alter table public.studio_outputs
  add column is_public boolean not null default false;

-- 2. Index for the public-route gallery query (filters on
--    is_public = true + orders by created_at desc).
create index studio_outputs_public_idx
  on public.studio_outputs(user_id, is_public, created_at desc)
  where is_public = true;

-- 3. RLS policy: anyone (anon role included) can SELECT outputs
--    where is_public = true. Existing user-owned SELECT policy is
--    unchanged, so logged-in users still see their own private
--    outputs.
create policy "Anyone can view public studio outputs"
  on public.studio_outputs for select
  using (is_public = true);

-- 4. Storage RLS: signed URLs we generate server-side at /p/[username]
--    work even for anon viewers because Supabase Storage validates
--    the URL signature, not the requesting auth context. No policy
--    change needed on storage.objects — the path-prefix policy stays
--    user-scoped for direct access, but signed URLs bypass it.

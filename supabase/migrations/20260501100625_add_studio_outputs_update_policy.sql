-- ============================================================
-- Fix: studio_outputs was missing an UPDATE policy
-- ============================================================
--
-- Phase 2's `20260430160438_studio_outputs_schema.sql` recreated
-- SELECT / INSERT / DELETE policies but didn't add an UPDATE one.
-- That hadn't bitten us until Phase 4a's portfolio toggle introduced
-- the first owner-side UPDATE on the table — it was being silently
-- denied by RLS.
--
-- Owner-only update, same shape as the other policies. Public viewers
-- still can't write because they fail the `auth.uid() = user_id` check.

create policy "Users can update own studio outputs"
  on public.studio_outputs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

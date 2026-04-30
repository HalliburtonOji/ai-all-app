-- ============================================================
-- Phase 2 — Studio outputs (superset of images, text, audio)
-- ============================================================
--
-- Rename studio_images → studio_outputs and extend it to host any
-- Studio tool's persisted output. Adds:
--   - kind: 'image' | 'text' | 'audio'
--   - content_text: nullable, populated for text drafts
--   - metadata: jsonb for per-tool extras (voice_id, char_count, etc.)
--   - storage_path: now nullable (text outputs have no file)
--
-- Existing images keep their IDs and signed-URL paths — no data move,
-- no Storage bucket change. The `studio-images` Storage bucket keeps
-- its current id (cosmetically misleading, but harmless; renaming
-- buckets cascades to storage.objects.bucket_id which is messy).
-- Future Phase 3+ may rename the bucket if it bothers anyone.
--
-- The messages.studio_image_id column is renamed to studio_output_id.
-- The FK auto-tracks the renamed table — Postgres FKs reference the
-- table OID, not the name.

-- 1. Rename the table.
alter table public.studio_images rename to studio_outputs;

-- 2. Rename the column on messages. The FK constraint name stays
--    studio_images-prefixed cosmetically; we don't rename it (Postgres
--    doesn't require constraint names to match anything).
alter table public.messages rename column studio_image_id to studio_output_id;

-- 3. Drop name-stale RLS policies + recreate with new names.
drop policy if exists "Users can view own studio images" on public.studio_outputs;
drop policy if exists "Users can insert own studio images" on public.studio_outputs;
drop policy if exists "Users can delete own studio images" on public.studio_outputs;

create policy "Users can view own studio outputs"
  on public.studio_outputs for select
  using (auth.uid() = user_id);

create policy "Users can insert own studio outputs"
  on public.studio_outputs for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own studio outputs"
  on public.studio_outputs for delete
  using (auth.uid() = user_id);

-- 4. Add kind column. Use a default during the ALTER so existing rows
--    backfill to 'image', then drop the default so future inserts must
--    specify kind explicitly.
alter table public.studio_outputs
  add column kind text not null default 'image'
  check (kind in ('image', 'text', 'audio'));

alter table public.studio_outputs alter column kind drop default;

-- 5. Text-output column + per-tool metadata column.
alter table public.studio_outputs add column content_text text null;
alter table public.studio_outputs add column metadata jsonb null;

-- 6. Allow null storage_path (text outputs have no file).
alter table public.studio_outputs alter column storage_path drop not null;

-- 7. Bump prompt cap from 1000 → 2000 chars (voice scripts can be
--    long; image prompts stay short by convention).
--    The original check constraint is auto-named studio_images_prompt_check;
--    after the rename it's still attached but referenced by old name.
alter table public.studio_outputs drop constraint if exists studio_images_prompt_check;
alter table public.studio_outputs drop constraint if exists studio_outputs_prompt_check;
alter table public.studio_outputs
  add constraint studio_outputs_prompt_check
  check (char_length(prompt) > 0 and char_length(prompt) <= 2000);

-- 8. Rotate the gallery index to include kind for fast per-tool queries.
drop index if exists public.studio_images_project_created_idx;
create index studio_outputs_project_kind_created_idx
  on public.studio_outputs(project_id, kind, created_at desc);

-- 9. Rename the messages-side index to follow the column rename.
drop index if exists public.messages_studio_image_idx;
create index messages_studio_output_idx
  on public.messages(studio_output_id)
  where studio_output_id is not null;

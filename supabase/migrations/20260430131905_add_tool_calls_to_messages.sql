-- ============================================================
-- Phase 1 — coach × studio integration
-- ============================================================
--
-- The coach gains the ability to use tools (Studio image gen for now).
-- A tool-using turn produces TWO assistant messages:
--   1. The "preamble" message — Claude's text before invoking the tool.
--      Has tool_call jsonb populated with { tool_use_id, name, input }.
--   2. The "tool result" message — content="" + studio_image_id set.
--
-- Existing text-only assistant turns are unchanged: tool_call is null,
-- studio_image_id is null. The role check constraint stays
-- ('user'|'assistant') — both turns are still "assistant" semantically.

alter table public.messages
  add column if not exists tool_call jsonb null;

alter table public.messages
  add column if not exists studio_image_id uuid null
  references public.studio_images(id) on delete set null;

-- Index for the (rare) "find all messages that show a given image"
-- direction. Mainly future-proofing: when a user deletes an image we
-- want to detach all references quickly.
create index if not exists messages_studio_image_idx
  on public.messages(studio_image_id)
  where studio_image_id is not null;

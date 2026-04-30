-- ============================================================
-- Phase 1 — relax messages.content check for tool-result rows
-- ============================================================
--
-- A tool-result message (the assistant turn that delivers the image
-- back to the user) carries the data in `studio_image_id`, so its
-- `content` is empty. The original baseline schema's check constraint
-- required `char_length(content) > 0`, which now blocks those inserts.
--
-- New rule: content must be non-empty UNLESS this is a tool-result
-- message (studio_image_id is set). Length cap stays the same.

alter table public.messages
  drop constraint if exists messages_content_check;

alter table public.messages
  add constraint messages_content_check
  check (
    (
      char_length(content) > 0
      and char_length(content) <= 100000
    )
    or (
      studio_image_id is not null
      and char_length(content) <= 100000
    )
  );

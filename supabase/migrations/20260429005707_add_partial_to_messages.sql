-- Add a `partial` flag to messages so we can mark assistant responses
-- whose stream was interrupted (network drop, Anthropic error mid-stream,
-- etc.). The UI uses this to offer a "retry" affordance on partial messages.
--
-- Default false; existing rows are unaffected (treated as complete).

alter table public.messages
  add column partial boolean not null default false;

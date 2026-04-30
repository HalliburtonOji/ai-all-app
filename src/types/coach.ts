export interface Conversation {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export type MessageRole = "user" | "assistant";

/**
 * A coach-generated suggestion for the user's next action. Shown as a
 * pill in the SuggestionTray.
 *
 * Default action ("coach"): clicking pre-fills the chat input with
 * `prompt`. Never auto-sent.
 *
 * Tool actions (e.g. "studio.image"): clicking navigates to the relevant
 * Studio tool tab with the prompt pre-filled in the tool's input.
 */
export type SuggestionAction = "coach" | "studio.image";

export interface Suggestion {
  label: string;
  prompt: string;
  action?: SuggestionAction;
}

/**
 * A single durable fact the coach remembers about a project.
 * Extracted nightly by the cron from recent conversations,
 * editable + deletable + pinnable by the user.
 */
export interface ProjectFact {
  id: string;
  project_id?: string;
  user_id?: string;
  fact: string;
  source_thread_id?: string | null;
  pinned: boolean;
  created_at: string;
  updated_at?: string;
}

/**
 * A user-level (cross-project) durable fact. Profile-level things the
 * coach knows about the person across all their Projects:
 * "User is based in London", "User prefers concise responses".
 *
 * Distinct from `ProjectFact` which is scoped to a single Project.
 */
export interface UserFact {
  id: string;
  user_id?: string;
  fact: string;
  source_project_id?: string | null;
  pinned: boolean;
  created_at: string;
  updated_at?: string;
}

/**
 * The structured payload stored on an assistant message that issued a
 * tool call. Mirrors Anthropic's `tool_use` content block.
 */
export interface MessageToolCall {
  tool_use_id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * Hydrated server-side: the Studio image attached to a "tool result"
 * assistant message (i.e. one with studio_image_id set). Carries a
 * fresh signed URL so the client can render without re-fetching.
 */
export interface MessageStudioImage {
  id: string;
  signed_url: string;
  prompt: string;
}

export interface Message {
  id: string;
  conversation_id?: string;
  role: MessageRole;
  content: string;
  model?: string | null;
  input_tokens?: number | null;
  output_tokens?: number | null;
  /**
   * True if this assistant message's stream was interrupted before
   * completing. Server marks it on partial saves; client uses this to
   * show a "retry?" affordance.
   */
  partial?: boolean;
  /**
   * Set on the assistant "preamble" message of a tool-using turn:
   * Claude's text before the tool was invoked + a structured record of
   * which tool was called with what input.
   */
  tool_call?: MessageToolCall | null;
  /**
   * Set on the assistant "tool result" message of a tool-using turn:
   * the message has empty content but renders as the tool output. For
   * Studio image tool turns, this is the studio_images.id reference.
   */
  studio_image_id?: string | null;
  /**
   * Hydrated by the server route that loads the message — joins the
   * studio_images row + a fresh signed URL.
   */
  studio_image?: MessageStudioImage | null;
  created_at: string;
}

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
  created_at: string;
}

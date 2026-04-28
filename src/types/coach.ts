export interface Conversation {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  conversation_id?: string;
  role: MessageRole;
  content: string;
  model?: string | null;
  input_tokens?: number | null;
  output_tokens?: number | null;
  created_at: string;
}

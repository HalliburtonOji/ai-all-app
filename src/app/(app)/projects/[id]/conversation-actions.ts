"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

/**
 * Create a brand-new conversation for the given project, then redirect
 * to the project page with that conversation selected.
 */
export async function createConversation(formData: FormData) {
  const projectId = formData.get("project_id") as string;
  if (!projectId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify the project belongs to the user before creating a child conversation.
  const { data: project } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project || project.user_id !== user.id) {
    redirect("/projects");
  }

  const { data, error } = await supabase
    .from("conversations")
    .insert({ project_id: projectId, user_id: user.id })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/projects/${projectId}`);
  }

  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}?conversation=${data.id}`);
}

/**
 * Rename a conversation. RLS enforces that the user can only rename
 * conversations they own; the app-level check is defense-in-depth.
 */
export async function renameConversation(formData: FormData) {
  const conversationId = formData.get("id") as string;
  const projectId = formData.get("project_id") as string;
  const rawTitle = ((formData.get("title") as string) ?? "").trim();
  if (!conversationId || !projectId) return;
  if (rawTitle.length === 0 || rawTitle.length > 200) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: conv } = await supabase
    .from("conversations")
    .select("id, user_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conv || conv.user_id !== user.id) return;

  await supabase
    .from("conversations")
    .update({ title: rawTitle })
    .eq("id", conversationId);

  revalidatePath(`/projects/${projectId}`);
}

/**
 * Used by the Regenerate per-message action on the coach UI.
 *
 * Given an assistant message ID, find the user message that immediately
 * preceded it, then delete:
 *   - that user message
 *   - the assistant message
 *   - any messages created after the user message in the same conversation
 *
 * Returns the deleted user message's content so the client can re-fire
 * /api/coach/stream with it as a fresh prompt. The streaming endpoint
 * inserts a new user-message row in the normal flow, which is fine —
 * the old turn is gone.
 */
export async function regenerateLastResponse(
  assistantMessageId: string,
): Promise<
  | {
      success: true;
      userMessageContent: string;
      conversationId: string;
    }
  | { success: false; error: string }
> {
  if (!assistantMessageId) {
    return { success: false, error: "Missing message id" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: assistantMessage } = await supabase
    .from("messages")
    .select("id, conversation_id, role, created_at")
    .eq("id", assistantMessageId)
    .maybeSingle();

  if (!assistantMessage || assistantMessage.role !== "assistant") {
    return { success: false, error: "Assistant message not found" };
  }

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, project_id, user_id")
    .eq("id", assistantMessage.conversation_id)
    .maybeSingle();
  if (!conversation || conversation.user_id !== user.id) {
    return { success: false, error: "Not authorized" };
  }

  // Find the user message that triggered this assistant response.
  const { data: priorUserMessage } = await supabase
    .from("messages")
    .select("id, content, created_at")
    .eq("conversation_id", assistantMessage.conversation_id)
    .eq("role", "user")
    .lt("created_at", assistantMessage.created_at)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!priorUserMessage) {
    return {
      success: false,
      error: "No user message found before this response",
    };
  }

  // Delete: that user message + everything after (this assistant + any
  // later turns the user might have appended after editing).
  await supabase
    .from("messages")
    .delete()
    .eq("conversation_id", assistantMessage.conversation_id)
    .gte("created_at", priorUserMessage.created_at);

  revalidatePath(`/projects/${conversation.project_id}`);

  return {
    success: true,
    conversationId: assistantMessage.conversation_id,
    userMessageContent: priorUserMessage.content,
  };
}

/**
 * Delete a conversation. Cascades to its messages via the FK we set up
 * in the baseline schema. After deletion, redirect to the project page;
 * the page will pick up the next-most-recent conversation, or auto-create
 * one if none remain.
 */
export async function deleteConversation(formData: FormData) {
  const conversationId = formData.get("id") as string;
  const projectId = formData.get("project_id") as string;
  if (!conversationId || !projectId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: conv } = await supabase
    .from("conversations")
    .select("id, user_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conv || conv.user_id !== user.id) return;

  await supabase.from("conversations").delete().eq("id", conversationId);

  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/utils/supabase/server";
import { COACH_SYSTEM_PROMPT } from "@/lib/coach/system-prompt";
import { buildProjectContext } from "@/lib/coach/build-context";
import type { Project } from "@/types/project";
import type { MessageRole } from "@/types/coach";

const MAX_MESSAGE_LENGTH = 10_000;
const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 2048;

export async function POST(request: Request) {
  // Parse + validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { conversationId, message } = (body ?? {}) as {
    conversationId?: unknown;
    message?: unknown;
  };

  if (typeof conversationId !== "string" || typeof message !== "string") {
    return NextResponse.json(
      { error: "conversationId and message are required strings" },
      { status: 400 },
    );
  }

  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return NextResponse.json(
      { error: "Message cannot be empty." },
      { status: 400 },
    );
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      {
        error: `Message must be ${MAX_MESSAGE_LENGTH.toLocaleString()} characters or fewer.`,
      },
      { status: 400 },
    );
  }

  // Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Verify the conversation belongs to the calling user.
  // RLS already enforces this — defense in depth at app level too.
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, project_id, user_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conversation || conversation.user_id !== user.id) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 },
    );
  }

  // Load the parent project for system context
  const { data: projectRow } = await supabase
    .from("projects")
    .select("*")
    .eq("id", conversation.project_id)
    .maybeSingle();

  if (!projectRow) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const project = projectRow as Project;

  // Load existing message history
  const { data: historyRows } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  const history = (historyRows ?? []) as { role: MessageRole; content: string }[];

  // Save the user message FIRST so it persists regardless of what happens next.
  const { data: savedUserMessage, error: userInsertErr } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      role: "user",
      content: trimmed,
    })
    .select("id, role, content, created_at")
    .single();

  if (userInsertErr || !savedUserMessage) {
    console.error("Failed to save user message:", userInsertErr);
    return NextResponse.json(
      { error: "Could not save your message — try again." },
      { status: 500 },
    );
  }

  // Generate the assistant response
  let assistantContent: string;
  let inputTokens: number | null = null;
  let outputTokens: number | null = null;
  let modelUsed: string;

  if (process.env.E2E_TEST_MODE === "true") {
    // Deterministic mock so tests don't depend on the model
    assistantContent = `[mock] I received: ${trimmed.slice(0, 50)}`;
    modelUsed = "mock";
  } else {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY missing in production env");
      return NextResponse.json(
        { error: "The coach is not configured on this server." },
        { status: 500 },
      );
    }

    const client = new Anthropic({ apiKey });
    const systemMessage =
      COACH_SYSTEM_PROMPT + "\n\n" + buildProjectContext(project);

    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemMessage,
        messages: [
          ...history.map((m) => ({ role: m.role, content: m.content })),
          { role: "user" as const, content: trimmed },
        ],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      assistantContent =
        textBlock && textBlock.type === "text"
          ? textBlock.text
          : "(the coach didn't return a text response — try again)";
      inputTokens = response.usage.input_tokens ?? null;
      outputTokens = response.usage.output_tokens ?? null;
      modelUsed = MODEL;
    } catch (err) {
      console.error("Anthropic API error:", err);
      // The user message is already saved. Don't save a phantom assistant
      // message — let the client retry.
      return NextResponse.json(
        {
          error:
            "The coach is having trouble — try again in a moment.",
        },
        { status: 502 },
      );
    }
  }

  // Save the assistant message
  const { data: savedAssistantMessage, error: asstInsertErr } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      role: "assistant",
      content: assistantContent,
      model: modelUsed,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
    })
    .select("id, role, content, created_at")
    .single();

  if (asstInsertErr || !savedAssistantMessage) {
    console.error("Failed to save assistant message:", asstInsertErr);
    // Best-effort: return the generated content even if persistence failed.
    return NextResponse.json({
      id: `unsaved-${Date.now()}`,
      role: "assistant",
      content: assistantContent,
      created_at: new Date().toISOString(),
    });
  }

  // Bump conversation.updated_at (the trigger overwrites with now() either way,
  // we just need ANY update to fire it).
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return NextResponse.json(savedAssistantMessage);
}

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/utils/supabase/server";
import { getUserApiKey } from "@/lib/byok/get-key";
import {
  SUGGESTION_SYSTEM_PROMPT,
  buildSuggestionContext,
  parseSuggestions,
} from "@/lib/coach/build-suggestions";
import type { Project } from "@/types/project";
import type { ProjectFact, Suggestion } from "@/types/coach";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 512;
const RECENT_MESSAGES_WINDOW = 10;

// Deterministic mock suggestions for E2E_TEST_MODE. Tests assert the count
// and that clicking either fills the chat input or routes to Studio with a
// pre-fill (for action="studio.image").
const MOCK_SUGGESTIONS: Suggestion[] = [
  {
    label: "Draft a first hook",
    prompt: "Help me draft a first hook for the next video.",
  },
  {
    label: "Sketch a thumbnail",
    prompt: "A bold thumbnail with bright colors and a curious facial expression.",
    action: "studio.image",
  },
  {
    label: "Audit my last post",
    prompt: "Audit my last post — what worked, what didn't?",
  },
];

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const { conversationId } = (body ?? {}) as { conversationId?: unknown };
  if (typeof conversationId !== "string" || conversationId.length === 0) {
    return jsonError("conversationId is required", 400);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError("Not authenticated", 401);

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, project_id, user_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conversation || conversation.user_id !== user.id) {
    return jsonError("Conversation not found", 404);
  }

  // Mock mode: fixed deterministic suggestions, no Anthropic call.
  if (process.env.E2E_TEST_MODE === "true") {
    return NextResponse.json({ suggestions: MOCK_SUGGESTIONS });
  }

  // Load project + memory + last N messages
  const [{ data: projectRow }, { data: factRows }, { data: messageRows }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("*")
        .eq("id", conversation.project_id)
        .maybeSingle(),
      supabase
        .from("project_facts")
        .select("id, fact, pinned, created_at")
        .eq("project_id", conversation.project_id)
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("messages")
        .select("role, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(RECENT_MESSAGES_WINDOW),
    ]);

  if (!projectRow) return jsonError("Project not found", 404);

  const project = projectRow as Project;
  const facts = (factRows ?? []) as ProjectFact[];
  const recentMessages = ((messageRows ?? []) as {
    role: string;
    content: string;
  }[])
    .slice()
    .reverse(); // chronological for the prompt

  // BYOK preference: use the user's stored Anthropic key if present.
  const userKey = await getUserApiKey(supabase, "anthropic");
  const apiKey = userKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[coach/suggest] no anthropic key available");
    return NextResponse.json({ suggestions: [] });
  }

  let suggestions: Suggestion[] = [];
  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SUGGESTION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildSuggestionContext(project, facts, recentMessages),
        },
      ],
    });

    const text =
      response.content[0]?.type === "text" ? response.content[0].text : "";
    suggestions = parseSuggestions(text);
  } catch (err) {
    // Silent fail — UI just hides the tray. Never breaks the chat.
    console.error("[coach/suggest] Anthropic call or parse failed:", err);
    suggestions = [];
  }

  return NextResponse.json({ suggestions });
}

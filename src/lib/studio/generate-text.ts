import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const MODEL = "claude-sonnet-4-6";
const MAX_PROMPT_LENGTH = 2000;
const MAX_OUTPUT_LENGTH = 1500;
const MAX_TOKENS = 800;

export type TextDraftKind = "email" | "social_post" | "caption" | "general";

const KIND_INSTRUCTIONS: Record<TextDraftKind, string> = {
  email:
    "Write a single email reply or outreach. Subject line on first line (no 'Subject:' prefix). Body underneath. Tight, friendly, professional. No salutation theatrics — open with the substance.",
  social_post:
    "Write one social post (Twitter/X, LinkedIn, Threads, IG). Punchy hook in the first 8 words. Total length ≤280 chars unless context clearly calls for long-form. No corporate hashtag spam.",
  caption:
    "Write a caption (image, video, podcast). One to three sentences max. Curious, specific, low-key.",
  general:
    "Write the requested copy. Keep it tight and concrete. Match the user's tone if discernible.",
};

export interface GenerateTextResult {
  outputId?: string;
  contentText?: string;
  error?: string;
}

/**
 * Generate a piece of copy/email/caption for a Project. Caller has
 * validated auth + project ownership.
 *
 * `memoryHint` (optional, ≤200 chars) is appended to the system prompt
 * so the draft respects what the coach already remembers about this
 * project + user.
 *
 * In E2E_TEST_MODE this skips Anthropic and inserts a deterministic
 * mock string so tests are free + reliable. Test-only `__fail__`
 * token in the prompt forces a failure path for testing the failure
 * UX.
 */
export async function generateTextDraftForProject(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  prompt: string,
  kindHint: TextDraftKind = "general",
  memoryHint?: string | null,
  apiKeyOverride?: string | null,
): Promise<GenerateTextResult> {
  const trimmed = prompt.trim();
  if (trimmed.length === 0) {
    return { error: "Prompt is empty" };
  }
  if (trimmed.length > MAX_PROMPT_LENGTH) {
    return { error: `Prompt exceeds ${MAX_PROMPT_LENGTH} characters` };
  }

  if (
    process.env.E2E_TEST_MODE === "true" &&
    trimmed.includes("__fail__")
  ) {
    return { error: "Forced test failure" };
  }

  const hint = memoryHint?.trim() || null;
  const outputId = randomUUID();

  let content: string;
  let modelLabel: string;

  if (process.env.E2E_TEST_MODE === "true") {
    const tag = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    content = `[mock copy ${tag}] [kind=${kindHint}]${
      hint ? ` [memory-applied]` : ""
    }`;
    modelLabel = hint ? "mock-text-with-context" : "mock-text";
  } else {
    const apiKey = apiKeyOverride ?? process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return { error: "ANTHROPIC_API_KEY not configured on server" };
    }

    try {
      const client = new Anthropic({ apiKey });
      const systemPrompt =
        KIND_INSTRUCTIONS[kindHint] +
        (hint ? `\n\nProject context (incorporate naturally): ${hint}` : "") +
        "\n\nOutput ONLY the copy. No preamble, no commentary, no surrounding quotes.";

      const resp = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [{ role: "user", content: trimmed }],
      });
      const text =
        resp.content[0]?.type === "text" ? resp.content[0].text : "";
      content = text.trim().slice(0, MAX_OUTPUT_LENGTH);
      modelLabel = apiKeyOverride ? `${MODEL}-byok` : MODEL;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Anthropic call failed";
      return { error: msg };
    }
  }

  if (content.length === 0) {
    return { error: "Model returned empty content" };
  }

  const { data: row, error: insertError } = await supabase
    .from("studio_outputs")
    .insert({
      id: outputId,
      project_id: projectId,
      user_id: userId,
      kind: "text",
      prompt: trimmed,
      content_text: content,
      storage_path: null,
      model: modelLabel,
      metadata: {
        kind_hint: kindHint,
        char_count: content.length,
        memory_hint_applied: hint !== null,
      },
    })
    .select("id")
    .maybeSingle();

  if (insertError || !row) {
    return { error: insertError?.message ?? "Failed to record text draft" };
  }

  return { outputId: row.id, contentText: content };
}

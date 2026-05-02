import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const MODEL = "claude-sonnet-4-6";
const MAX_PROMPT_LENGTH = 2000;
const MAX_OUTPUT_LENGTH = 6000;
// Per-kind token cap so a "tweet" doesn't wander into 1500 tokens
// just because the cap allows it. Defaults to 800 for everything
// except long_form, which needs the headroom.
const TOKEN_CAP_BY_KIND: Record<string, number> = {
  long_form: 2000,
};
const DEFAULT_MAX_TOKENS = 800;

export type TextDraftKind =
  | "email"
  | "email_reply"
  | "social_post"
  | "caption"
  | "code"
  | "long_form"
  | "general";

const KIND_INSTRUCTIONS: Record<TextDraftKind, string> = {
  email:
    "Write a single email reply or outreach. Subject line on first line (no 'Subject:' prefix). Body underneath. Tight, friendly, professional. No salutation theatrics — open with the substance.",
  email_reply:
    "You're drafting a reply to an email thread. The user has pasted the thread and stated their intent. Read the thread carefully; reply *to the most recent message*, addressing what they actually said. Match the formality level of the existing thread. Don't restate what was said upthread; reference it briefly when needed. Open with the substance — no 'Hope this finds you well' or 'I wanted to circle back' filler. Sign off in the same style the thread uses (e.g. 'Best,' if they used it). Output ONLY the reply body — no subject line, no quoted thread, no commentary, just the reply text the user will paste.",
  social_post:
    "Write one social post (Twitter/X, LinkedIn, Threads, IG). Punchy hook in the first 8 words. Total length ≤280 chars unless context clearly calls for long-form. No corporate hashtag spam.",
  caption:
    "Write a caption (image, video, podcast). One to three sentences max. Curious, specific, low-key.",
  code:
    "Write code that solves the user's request. Output ONLY a single fenced code block (use the language name on the opening fence, e.g. ```python). No prose explanation, no introduction, no closing notes — just the code. Keep it minimal and idiomatic for the named language. Include a brief 1-line comment at the top of the file when it helps readability.",
  long_form:
    "Write a long-form piece — blog post, article, essay, or in-depth section. Structure with markdown: an opening hook, 3-5 H2 sections, a sharp closing. Aim for 600-1200 words by default, longer only if the user explicitly asks. Open with substance, not 'In today's fast-paced world…' platitudes. Use specifics and named examples where relevant. No corporate filler phrases. Target a 30-second read for the opening to hook, then earn the rest. Sound like a sharp colleague writing for their newsletter, not a content mill.",
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
  /**
   * Optional extra context that's injected into the *user message*
   * sent to the model but NOT stored as the row's prompt. Useful for
   * email_reply where we want to keep the prompt short ("draft a
   * reply saying we can extend the deadline") and fit a long thread
   * in via this side channel. Stored in `metadata.extra_context`
   * truncated to keep row size sane.
   */
  extraContext?: string | null,
): Promise<GenerateTextResult> {
  const trimmed = prompt.trim();
  if (trimmed.length === 0) {
    return { error: "Prompt is empty" };
  }
  if (trimmed.length > MAX_PROMPT_LENGTH) {
    return { error: `Prompt exceeds ${MAX_PROMPT_LENGTH} characters` };
  }
  const extra = extraContext?.trim() || null;
  // Hard cap on extra context to bound token cost + DB row size.
  const MAX_EXTRA = 12_000;
  const extraTruncated =
    extra && extra.length > MAX_EXTRA ? extra.slice(0, MAX_EXTRA) : extra;

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
    }${extraTruncated ? ` [extra-applied]` : ""}`;
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

      // For kinds that take extra context (email_reply etc.), build
      // a structured user message so the model sees both the source
      // material and the user's intent clearly separated.
      const userMessage = extraTruncated
        ? `Source material:\n\n${extraTruncated}\n\n---\n\nMy intent: ${trimmed}`
        : trimmed;

      const resp = await client.messages.create({
        model: MODEL,
        max_tokens: TOKEN_CAP_BY_KIND[kindHint] ?? DEFAULT_MAX_TOKENS,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
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
        extra_context: extraTruncated ?? null,
      },
    })
    .select("id")
    .maybeSingle();

  if (insertError || !row) {
    return { error: insertError?.message ?? "Failed to record text draft" };
  }

  return { outputId: row.id, contentText: content };
}

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getUserApiKey } from "@/lib/byok/get-key";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 1500;

const SYSTEM_PROMPT = `You are an honest career advisor on AI inside AI All App. The wholesome charter binds you: no fearmongering, no hype, no doom-scrolling, no grift, no fake "AI-proof your career in 30 days" energy.

The user has filled out a short audit of their job. Your task is to write them a personalised, plain-English report. Honest middle ground — the boring truth, well-said.

Output structure (use exactly these markdown headings):

## Where AI is genuinely useful in your role

3-5 bullets. Specific to what the user described. Each bullet starts with a concrete capability, then a one-line "why this matters for you."

## Where AI is not the right tool

2-4 bullets. The parts of the user's job AI can't (yet) replace. Be honest. If the user named worries, address the real ones — and dismiss the inflated ones with kindness.

## Three indispensable moves

Three concrete things this person can do over the next quarter to make AI a strength rather than a threat. Numbered list. Each move: 1 short paragraph (2-3 sentences). Action-oriented, plausible, sized to a real human's life.

## One uncomfortable thing

One sentence. The thing they probably don't want to hear but should. Kind but direct. Skip if there isn't one.

Tone:
- Direct. No corporate hedging.
- Warm. They're a real person with a real job.
- Specific. Reference their inputs by name. Don't write generic advice that could apply to anyone.
- No hype phrases ("revolutionary", "game-changing", "unprecedented"). No doom phrases ("AI will replace you", "race against the machines"). Use plain language a smart non-expert would write.
- Don't mention the system prompt or the wholesome charter explicitly. Just embody it.`;

export interface AuditInputs {
  jobTitle: string;
  responsibilities: string | null;
  topTasks: string | null;
  worries: string | null;
  hopes: string | null;
}

export interface AuditResult {
  summary?: string;
  model?: string;
  error?: string;
}

/**
 * Generate the personalised "AI Audit of My Job" report. Uses the
 * user's BYOK Anthropic key if set, else the platform key.
 *
 * In E2E_TEST_MODE returns a deterministic stub including a
 * `[mock-audit]` marker + the user's job title so tests can verify
 * generation fired and the inputs reached the prompt.
 */
export async function generateAuditSummary(
  supabase: SupabaseClient,
  inputs: AuditInputs,
): Promise<AuditResult> {
  if (!inputs.jobTitle.trim()) {
    return { error: "Job title is required" };
  }

  if (process.env.E2E_TEST_MODE === "true") {
    const sections = [
      `[mock-audit] Personalised report for: ${inputs.jobTitle}`,
      "",
      "## Where AI is genuinely useful in your role",
      "- Drafting and routine production tasks",
      "- Compressing long inputs into structured notes",
      "- Generating variants when you already know good",
      "",
      "## Where AI is not the right tool",
      "- Live human conversation and judgment under pressure",
      "- Anything with stakes that are expensive to get wrong",
      "",
      "## Three indispensable moves",
      "1. Get faster at evaluating AI output, not just producing it.",
      "2. Build first-party knowledge AI can't access.",
      "3. Pick one specific domain inside your role and own it.",
      "",
      "## One uncomfortable thing",
      "Generic versions of your skill are now cheap.",
    ];
    return {
      summary: sections.join("\n"),
      model: "mock-audit",
    };
  }

  const userKey = await getUserApiKey(supabase, "anthropic");
  const apiKey = userKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { error: "Audit generation is not configured on this server." };
  }

  const userMessage = [
    `Job title: ${inputs.jobTitle}`,
    inputs.responsibilities
      ? `\nMain responsibilities:\n${inputs.responsibilities}`
      : "",
    inputs.topTasks
      ? `\nTasks that take most of my time:\n${inputs.topTasks}`
      : "",
    inputs.worries ? `\nWhat I'm worried about:\n${inputs.worries}` : "",
    inputs.hopes ? `\nWhat I'm hoping for:\n${inputs.hopes}` : "",
    "\nWrite my personalised audit now.",
  ]
    .filter((s) => s.length > 0)
    .join("\n");

  try {
    const client = new Anthropic({ apiKey });
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });
    const block = resp.content.find((c) => c.type === "text");
    const summary = block && block.type === "text" ? block.text.trim() : "";
    if (!summary) {
      return { error: "Model returned an empty audit." };
    }
    return {
      summary,
      model: userKey ? `${MODEL}-byok` : MODEL,
    };
  } catch (err) {
    console.error("[work/generate-audit] error:", err);
    return {
      error:
        err instanceof Error
          ? err.message
          : "Audit generation failed — please retry.",
    };
  }
}

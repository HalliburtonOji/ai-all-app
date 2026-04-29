import type { Project } from "@/types/project";
import type { ProjectFact, Suggestion } from "@/types/coach";
import { buildProjectContext } from "./build-context";
import { buildMemoryContext } from "./build-memory";

const MAX_LABEL_LENGTH = 80;
const MAX_PROMPT_LENGTH = 200;
const MAX_SUGGESTIONS = 3;

export const SUGGESTION_SYSTEM_PROMPT = `You generate "what next" suggestions for an AI coach inside a single Project. The user's just had part of a conversation with the coach. Your job is to surface 2–3 short, concrete next actions specific to this project, its remembered facts, and the recent conversation — things the user could click to continue making progress.

Hard requirements:
- Output ONLY a JSON array. No preamble, no markdown, no code fences.
- 2 or 3 items. Never more, never fewer.
- Each item is an object: { "label": string, "prompt": string }
- "label" is what shows on a small pill button. ≤8 words. Imperative or curious tone. Example: "Draft your hook", "Map the first week", "Steal a winning thumbnail".
- "prompt" is what gets put in the user's chat box if they click. ≤200 characters. Phrased as if the user were typing it. First person.
- Suggestions should feel like *invitations*, not assignments. No "you should", no "you must".
- Don't suggest things they've already done in the recent conversation.
- Specific to THIS project (use its name, type, description, and remembered facts). No generic advice.
- If you can't think of 2 good suggestions, return an empty array [].`;

/**
 * Build the user-message payload sent to Anthropic for suggestion generation.
 * Reuses the same project + memory context the coach itself sees, so the
 * suggestions are framed by exactly what the coach knows.
 */
export function buildSuggestionContext(
  project: Project,
  facts: ProjectFact[],
  recentMessages: { role: string; content: string }[],
): string {
  const projectContext = buildProjectContext(project);
  const memoryContext = buildMemoryContext(facts);

  const transcript =
    recentMessages.length > 0
      ? recentMessages
          .map(
            (m) =>
              `${m.role === "user" ? "User" : "Coach"}: ${m.content.slice(0, 800)}`,
          )
          .join("\n\n")
      : "(no messages yet)";

  return [
    projectContext,
    memoryContext || "",
    "Recent conversation (most recent at the bottom):",
    transcript,
    "Return the JSON array of 2–3 suggestions now.",
  ]
    .filter((s) => s.trim().length > 0)
    .join("\n\n");
}

/**
 * Parse Anthropic's raw text into validated `Suggestion[]`. Tolerates code
 * fences and extra whitespace. Silently returns [] on any structural
 * failure — callers should treat that as "no suggestions" rather than an error.
 */
export function parseSuggestions(rawText: string): Suggestion[] {
  if (!rawText) return [];
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  const out: Suggestion[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const obj = item as { label?: unknown; prompt?: unknown };
    if (
      typeof obj.label !== "string" ||
      typeof obj.prompt !== "string" ||
      obj.label.trim().length === 0 ||
      obj.prompt.trim().length === 0
    ) {
      continue;
    }
    out.push({
      label: obj.label.trim().slice(0, MAX_LABEL_LENGTH),
      prompt: obj.prompt.trim().slice(0, MAX_PROMPT_LENGTH),
    });
    if (out.length >= MAX_SUGGESTIONS) break;
  }
  return out;
}

import type { ProjectFact, UserFact } from "@/types/coach";

/**
 * Build the "What you remember about this project" section of the
 * coach's system prompt. Facts are listed as bullets, pinned first.
 *
 * Returns empty string when there are no facts — callers should
 * conditionally append this section.
 */
export function buildMemoryContext(facts: ProjectFact[]): string {
  if (facts.length === 0) return "";

  const lines = facts.map((f) => `- ${f.fact}`).join("\n");
  return `What you remember about this project:\n\n${lines}`;
}

/**
 * Build the "What you remember about this user" section of the coach's
 * system prompt. User-level facts apply across all of the user's projects.
 * Pinned first, then most recent.
 *
 * Returns empty string when there are no facts.
 */
export function buildUserMemoryContext(facts: UserFact[]): string {
  if (facts.length === 0) return "";

  const lines = facts.map((f) => `- ${f.fact}`).join("\n");
  return `What you remember about this user (across all their projects):\n\n${lines}`;
}

import type { ProjectFact } from "@/types/coach";

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

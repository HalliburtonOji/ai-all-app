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

const STUDIO_MEMORY_HINT_MAX = 200;

/**
 * Build a compact memory hint to append to a Studio image-gen prompt.
 * Image models (FLUX schnell) have ~256-token prompt windows, so we
 * cap the hint hard at 200 chars and pull only the highest-priority
 * facts: pinned first, then most recent. Fact text is concatenated
 * with `; ` separators; truncated mid-fact if needed.
 *
 * Returns null if no facts apply, so callers can `if (hint)` to add a
 * separator only when meaningful.
 */
export function buildStudioMemoryHint(
  projectFacts: ProjectFact[],
  userFacts: UserFact[],
): string | null {
  const pool = [...projectFacts, ...userFacts]
    .map((f) => f.fact.trim())
    .filter((s) => s.length > 0);
  if (pool.length === 0) return null;

  const joined = pool.join("; ");
  if (joined.length <= STUDIO_MEMORY_HINT_MAX) return joined;
  return joined.slice(0, STUDIO_MEMORY_HINT_MAX - 1).trimEnd() + "…";
}

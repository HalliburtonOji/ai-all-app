import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 1024;
const MAX_FACTS_PER_PROJECT = 50;
const MAX_CONVERSATION_CHARS = 30_000;

const SYSTEM_PROMPT = `You read conversations between a user and an AI coach inside a single Project, and extract DURABLE facts about the user's project, situation, preferences, or context that would help the coach be more useful in future conversations.

What counts as a fact worth remembering:
- Specific intentions ("Wants to grow a TikTok cooking channel focused on Nigerian food")
- Constraints, situations, target audiences ("Targeting diaspora audience first")
- Stated preferences or skills ("Prefers prose over bullet lists", "Has experience with food photography")
- Concrete plans or commitments ("Plans to post three times a week")
- Background context that affects advice ("Lives in Lagos", "Works full-time as a software engineer")

What does NOT count:
- Greetings, small talk, thanks
- Vague or generic statements ("Wants to grow", "Likes cooking")
- One-off questions answered in the moment
- Anything already covered by an existing fact

Output requirements:
- Output ONLY a JSON array of strings. No preamble, no markdown, no code fences.
- Each string is a single fact, 500 characters or fewer.
- Return [] if nothing new and durable to add.
- Do NOT duplicate existing facts.`;

export interface ExtractionResult {
  projectId: string;
  newFactsCount: number;
  droppedFactsCount: number;
  skippedReason?: string;
  error?: string;
}

/**
 * Extract durable facts from a project's recent conversations and persist
 * them. Caller passes in a supabase client — the user's session client for
 * manual triggers, or the service-role client for cron runs.
 *
 * In E2E_TEST_MODE this is a no-op; tests don't burn API credit on
 * extraction.
 */
export async function extractFactsForProject(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ExtractionResult> {
  if (process.env.E2E_TEST_MODE === "true") {
    // In tests, insert ONE deterministic mock fact + run the same cap
    // enforcement, so cap behavior is testable end-to-end without ever
    // calling Anthropic.
    const { data: project } = await supabase
      .from("projects")
      .select("user_id")
      .eq("id", projectId)
      .maybeSingle();
    if (!project) {
      return {
        projectId,
        newFactsCount: 0,
        droppedFactsCount: 0,
        error: "Project not found",
      };
    }

    const { data: thread } = await supabase
      .from("conversations")
      .select("id")
      .eq("project_id", projectId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const insertResult = await supabase
      .from("project_facts")
      .insert({
        project_id: projectId,
        user_id: project.user_id,
        fact: `[mock fact ${Date.now()}-${Math.random().toString(16).slice(2, 8)}]`,
        source_thread_id: thread?.id ?? null,
        pinned: false,
      })
      .select("id");

    const newFactsCount = insertResult.data?.length ?? 0;
    const droppedFactsCount = await enforceFactCap(supabase, projectId);

    await supabase
      .from("projects")
      .update({ project_facts_last_extracted_at: new Date().toISOString() })
      .eq("id", projectId);

    return {
      projectId,
      newFactsCount,
      droppedFactsCount,
      skippedReason: "test_mode",
    };
  }

  // Load project + last-extracted timestamp + owning user
  const { data: project } = await supabase
    .from("projects")
    .select(
      "id, name, project_type, description, user_id, project_facts_last_extracted_at",
    )
    .eq("id", projectId)
    .maybeSingle();

  if (!project) {
    return {
      projectId,
      newFactsCount: 0,
      droppedFactsCount: 0,
      error: "Project not found",
    };
  }

  // Find conversations belonging to this project
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id")
    .eq("project_id", projectId);

  if (!conversations || conversations.length === 0) {
    await supabase
      .from("projects")
      .update({ project_facts_last_extracted_at: new Date().toISOString() })
      .eq("id", projectId);
    return {
      projectId,
      newFactsCount: 0,
      droppedFactsCount: 0,
      skippedReason: "no_conversations",
    };
  }

  const conversationIds = conversations.map((c: { id: string }) => c.id);

  // Load messages since last extraction. If never run, load all.
  let messagesQuery = supabase
    .from("messages")
    .select("role, content, conversation_id, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: true });

  if (project.project_facts_last_extracted_at) {
    messagesQuery = messagesQuery.gt(
      "created_at",
      project.project_facts_last_extracted_at,
    );
  }

  const { data: messages } = await messagesQuery;

  if (!messages || messages.length === 0) {
    await supabase
      .from("projects")
      .update({ project_facts_last_extracted_at: new Date().toISOString() })
      .eq("id", projectId);
    return {
      projectId,
      newFactsCount: 0,
      droppedFactsCount: 0,
      skippedReason: "no_new_messages",
    };
  }

  // Load existing facts so we can pass them and avoid duplicates
  const { data: existingFacts } = await supabase
    .from("project_facts")
    .select("fact")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      projectId,
      newFactsCount: 0,
      droppedFactsCount: 0,
      error: "ANTHROPIC_API_KEY missing",
    };
  }

  // Build the extraction prompt
  const conversationText = messages
    .map(
      (m: { role: string; content: string }) =>
        `${m.role === "user" ? "User" : "Coach"}: ${m.content}`,
    )
    .join("\n\n")
    .slice(0, MAX_CONVERSATION_CHARS);

  const existingFactsText =
    existingFacts && existingFacts.length > 0
      ? existingFacts
          .map((f: { fact: string }) => `- ${f.fact}`)
          .join("\n")
      : "(none yet)";

  const userPrompt = `Project: ${project.name} (${project.project_type})${
    project.description ? `\nDescription: ${project.description}` : ""
  }

Existing facts already remembered:
${existingFactsText}

New conversation messages to analyze:
${conversationText}

Return a JSON array of new facts to remember (or [] if nothing new).`;

  let extractedFacts: string[] = [];
  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text =
      response.content[0]?.type === "text" ? response.content[0].text : "[]";
    // Strip optional code fences
    const cleaned = text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const parsed: unknown = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      extractedFacts = parsed
        .filter(
          (f): f is string =>
            typeof f === "string" && f.trim().length > 0 && f.length <= 500,
        )
        .map((f) => f.trim());
    }
  } catch (err) {
    console.error("[extract-facts] Anthropic call or parse failed:", err);
    return {
      projectId,
      newFactsCount: 0,
      droppedFactsCount: 0,
      error: (err as Error).message,
    };
  }

  if (extractedFacts.length === 0) {
    await supabase
      .from("projects")
      .update({ project_facts_last_extracted_at: new Date().toISOString() })
      .eq("id", projectId);
    return { projectId, newFactsCount: 0, droppedFactsCount: 0 };
  }

  // Pick the most-active conversation in this batch as the source thread
  const threadCounts: Record<string, number> = {};
  for (const m of messages as { conversation_id: string }[]) {
    threadCounts[m.conversation_id] =
      (threadCounts[m.conversation_id] ?? 0) + 1;
  }
  const mostActiveThreadId =
    Object.entries(threadCounts).sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0] ?? null;

  // Insert new facts
  const factsToInsert = extractedFacts.map((fact) => ({
    project_id: projectId,
    user_id: project.user_id,
    fact,
    source_thread_id: mostActiveThreadId,
    pinned: false,
  }));

  const { data: inserted, error: insertErr } = await supabase
    .from("project_facts")
    .insert(factsToInsert)
    .select("id");

  if (insertErr) {
    console.error("[extract-facts] insert failed:", insertErr);
    return {
      projectId,
      newFactsCount: 0,
      droppedFactsCount: 0,
      error: insertErr.message,
    };
  }

  const newFactsCount = inserted?.length ?? 0;
  const droppedFactsCount = await enforceFactCap(supabase, projectId);

  await supabase
    .from("projects")
    .update({ project_facts_last_extracted_at: new Date().toISOString() })
    .eq("id", projectId);

  return { projectId, newFactsCount, droppedFactsCount };
}

/**
 * Drop oldest non-pinned facts for a project until the count is at or below
 * MAX_FACTS_PER_PROJECT. Returns the number dropped.
 */
async function enforceFactCap(
  supabase: SupabaseClient,
  projectId: string,
): Promise<number> {
  const { count } = await supabase
    .from("project_facts")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  if (count === null || count === undefined || count <= MAX_FACTS_PER_PROJECT) {
    return 0;
  }

  const overage = count - MAX_FACTS_PER_PROJECT;
  const { data: toDrop } = await supabase
    .from("project_facts")
    .select("id")
    .eq("project_id", projectId)
    .eq("pinned", false)
    .order("created_at", { ascending: true })
    .limit(overage);

  if (!toDrop || toDrop.length === 0) return 0;

  const ids = toDrop.map((f: { id: string }) => f.id);
  await supabase.from("project_facts").delete().in("id", ids);
  return ids.length;
}

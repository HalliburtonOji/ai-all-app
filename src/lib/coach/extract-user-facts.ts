import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 1024;
const MAX_FACTS_PER_USER = 100;
const MAX_CONVERSATION_CHARS = 40_000;
const MAX_MESSAGES_TO_SCAN = 200;

const SYSTEM_PROMPT = `You read conversations between a user and an AI coach across MULTIPLE Projects the user owns. Your job is to extract DURABLE PROFILE-LEVEL facts that apply across all their projects — things about the PERSON themselves, their constraints, preferences, and cross-cutting patterns. These get injected into every coach conversation the user has, in any project.

What counts as a user-level fact:
- Personal context (location, role, time zone, current job, family situation that affects work)
- Cross-project preferences (prefers prose over bullet lists, prefers weekly cadence, hates buzzwords)
- Skills and expertise (experienced photographer, comfortable with Python, decade of marketing)
- Cross-cutting constraints (~10 hours per week to spend, mobile-only, low/no budget)
- Identity-level patterns (running 3 side hustles, building in public, neurodivergent and uses certain accommodations)
- Stated working style or values that should color any advice

What does NOT count:
- Anything specific to a single Project (those live in project_facts already, don't duplicate)
- One-off questions answered in the moment
- Vague generalities ("user wants to grow", "user is creative")
- Hot-take preferences from a single message that might not be durable

Output requirements:
- Output ONLY a JSON array of strings. No preamble, no markdown, no code fences.
- Each string is a single fact, ≤500 characters.
- Return [] if nothing new and durable to add.
- Do NOT duplicate existing facts.`;

export interface UserExtractionResult {
  userId: string;
  newFactsCount: number;
  droppedFactsCount: number;
  skippedReason?: string;
  error?: string;
}

/**
 * Extract durable user-level facts across all of a user's conversations.
 * Caller passes in a supabase client — service-role for cron, user's own
 * for manual triggers.
 *
 * In E2E_TEST_MODE inserts a deterministic mock fact so cap behavior is
 * end-to-end testable without calling Anthropic.
 */
export async function extractUserFacts(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserExtractionResult> {
  if (process.env.E2E_TEST_MODE === "true") {
    // Ensure user_meta row exists
    await supabase
      .from("user_meta")
      .upsert(
        { user_id: userId, user_facts_last_extracted_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );

    // Pick any project for source attribution (optional)
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const insertResult = await supabase
      .from("user_facts")
      .insert({
        user_id: userId,
        fact: `[mock user fact ${Date.now()}-${Math.random().toString(16).slice(2, 8)}]`,
        source_project_id: project?.id ?? null,
        pinned: false,
      })
      .select("id");

    const newFactsCount = insertResult.data?.length ?? 0;
    const droppedFactsCount = await enforceUserFactCap(supabase, userId);

    return {
      userId,
      newFactsCount,
      droppedFactsCount,
      skippedReason: "test_mode",
    };
  }

  // Get last extraction timestamp
  const { data: meta } = await supabase
    .from("user_meta")
    .select("user_facts_last_extracted_at")
    .eq("user_id", userId)
    .maybeSingle();
  const lastExtractedAt = meta?.user_facts_last_extracted_at ?? null;

  // All conversation IDs for this user
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", userId);

  if (!conversations || conversations.length === 0) {
    await touchMeta(supabase, userId);
    return {
      userId,
      newFactsCount: 0,
      droppedFactsCount: 0,
      skippedReason: "no_conversations",
    };
  }

  const conversationIds = conversations.map((c: { id: string }) => c.id);

  // Load messages since last extraction. If first run, load most recent N.
  let messagesQuery = supabase
    .from("messages")
    .select("role, content, conversation_id, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: true })
    .limit(MAX_MESSAGES_TO_SCAN);

  if (lastExtractedAt) {
    messagesQuery = messagesQuery.gt("created_at", lastExtractedAt);
  }

  const { data: messages } = await messagesQuery;

  if (!messages || messages.length === 0) {
    await touchMeta(supabase, userId);
    return {
      userId,
      newFactsCount: 0,
      droppedFactsCount: 0,
      skippedReason: "no_new_messages",
    };
  }

  // Load existing user facts for the prompt
  const { data: existingFacts } = await supabase
    .from("user_facts")
    .select("fact")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      userId,
      newFactsCount: 0,
      droppedFactsCount: 0,
      error: "ANTHROPIC_API_KEY missing",
    };
  }

  const conversationText = (messages as { role: string; content: string }[])
    .map((m) => `${m.role === "user" ? "User" : "Coach"}: ${m.content}`)
    .join("\n\n")
    .slice(0, MAX_CONVERSATION_CHARS);

  const existingFactsText =
    existingFacts && existingFacts.length > 0
      ? existingFacts
          .map((f: { fact: string }) => `- ${f.fact}`)
          .join("\n")
      : "(none yet)";

  const userPrompt = `Existing user-level facts already remembered:
${existingFactsText}

New conversation messages from across all the user's projects:
${conversationText}

Return a JSON array of new user-level facts to remember (or [] if nothing new and durable).`;

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
    console.error("[extract-user-facts] Anthropic call or parse failed:", err);
    return {
      userId,
      newFactsCount: 0,
      droppedFactsCount: 0,
      error: (err as Error).message,
    };
  }

  if (extractedFacts.length === 0) {
    await touchMeta(supabase, userId);
    return { userId, newFactsCount: 0, droppedFactsCount: 0 };
  }

  // Pick the most-active project in this batch as source attribution
  const projectCounts: Record<string, number> = {};
  // (We'd need to join messages → conversations → projects to do this properly.
  // For source attribution we just pick the most-recently-updated project.)
  const { data: recentProject } = await supabase
    .from("projects")
    .select("id")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const factsToInsert = extractedFacts.map((fact) => ({
    user_id: userId,
    fact,
    source_project_id: recentProject?.id ?? null,
    pinned: false,
  }));

  const { data: inserted, error: insertErr } = await supabase
    .from("user_facts")
    .insert(factsToInsert)
    .select("id");

  if (insertErr) {
    console.error("[extract-user-facts] insert failed:", insertErr);
    return {
      userId,
      newFactsCount: 0,
      droppedFactsCount: 0,
      error: insertErr.message,
    };
  }

  const newFactsCount = inserted?.length ?? 0;
  const droppedFactsCount = await enforceUserFactCap(supabase, userId);

  await touchMeta(supabase, userId);

  return { userId, newFactsCount, droppedFactsCount };
}

async function touchMeta(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  await supabase
    .from("user_meta")
    .upsert(
      {
        user_id: userId,
        user_facts_last_extracted_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
}

async function enforceUserFactCap(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { count } = await supabase
    .from("user_facts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (count === null || count === undefined || count <= MAX_FACTS_PER_USER) {
    return 0;
  }

  const overage = count - MAX_FACTS_PER_USER;
  const { data: toDrop } = await supabase
    .from("user_facts")
    .select("id")
    .eq("user_id", userId)
    .eq("pinned", false)
    .order("created_at", { ascending: true })
    .limit(overage);

  if (!toDrop || toDrop.length === 0) return 0;

  const ids = toDrop.map((f: { id: string }) => f.id);
  await supabase.from("user_facts").delete().in("id", ids);
  return ids.length;
}

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/utils/supabase/server";
import { getLessonBySlug } from "@/lib/learn/lessons";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 1024;
const MAX_QUESTION_LENGTH = 2_000;

const TUTOR_SYSTEM_PROMPT = `You are the Tutor — a focused mode of the AI Coach inside AI All App. Right now the user is in the middle of a Learn lesson. Your job is to help them understand the *current lesson*, not to drift off-topic.

How you work:

- Ground every answer in the lesson the user is currently reading. Refer back to the lesson's points by name when they're relevant.
- Keep replies short. 2–4 sentences in most cases. The user is mid-lesson, not deep in a long chat.
- If the user asks something off-topic, give them one helpful sentence and gently point them at the regular Coach tab inside a Project for deeper conversations.
- Never invent specific facts, citations, or numbers. If they ask "is X true?", say what you can verify from the lesson and tell them how to check the rest.
- Match the wholesome tone — direct, no hype, no fearmongering, no condescension.`;

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { lessonSlug, question } = (body ?? {}) as {
    lessonSlug?: unknown;
    question?: unknown;
  };

  if (typeof lessonSlug !== "string" || typeof question !== "string") {
    return Response.json(
      { error: "lessonSlug and question are required strings" },
      { status: 400 },
    );
  }

  const trimmed = question.trim();
  if (!trimmed) {
    return Response.json({ error: "Question is empty." }, { status: 400 });
  }
  if (trimmed.length > MAX_QUESTION_LENGTH) {
    return Response.json(
      {
        error: `Question must be ${MAX_QUESTION_LENGTH.toLocaleString()} characters or fewer.`,
      },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const lesson = getLessonBySlug(lessonSlug);
  if (!lesson) {
    return Response.json({ error: "Lesson not found" }, { status: 404 });
  }

  const isMock = process.env.E2E_TEST_MODE === "true";
  if (isMock) {
    // Deterministic response so the spec can assert on a stable
    // marker. Includes the lesson slug so we can verify context
    // injection worked.
    return Response.json({
      reply: `[mock-tutor] About "${lesson.title}" — I received: ${trimmed.slice(0, 80)}`,
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Tutor not configured on this server." },
      { status: 500 },
    );
  }

  // Cap lesson body length in the system message — most lessons are
  // short, but we don't want a runaway content file to blow the
  // token budget.
  const lessonExcerpt = lesson.body.slice(0, 6_000);
  const systemMessage =
    TUTOR_SYSTEM_PROMPT +
    "\n\n" +
    "## Current lesson\n\n" +
    `Title: ${lesson.title}\n` +
    `Summary: ${lesson.summary}\n\n` +
    "Body:\n\n" +
    lessonExcerpt;

  try {
    const client = new Anthropic({ apiKey });
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemMessage,
      messages: [{ role: "user", content: trimmed }],
    });
    const textBlock = resp.content.find((c) => c.type === "text");
    const reply =
      textBlock && textBlock.type === "text" ? textBlock.text : "";
    return Response.json({ reply: reply || "(no response)" });
  } catch (err) {
    console.error("[learn/tutor] error:", err);
    return Response.json(
      { error: "The tutor was interrupted — please retry." },
      { status: 502 },
    );
  }
}

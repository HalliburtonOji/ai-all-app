import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/utils/supabase/server";
import { getUserApiKey } from "@/lib/byok/get-key";
import { getLessonBySlug } from "@/lib/learn/lessons";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 1024;
const MAX_ATTEMPT_LENGTH = 6_000;

const SYSTEM_PROMPT = `You are the lesson coach inside AI All App. The user has just submitted their attempt at the "Try it" exercise from a Learn lesson. Your job is to give them specific, useful feedback against the lesson's rubric.

How you reply:

- **Be specific.** Reference parts of their submission directly. Quote a phrase or sentence when you flag it.
- **Lead with what's working.** Even short praise is useful — they're learning by doing.
- **Then the changes.** Concrete moves. Not "be more specific" — show what specific would look like for THEIR submission.
- **One uncomfortable truth.** If there's a habit they should drop, say it. Kind but direct.
- **Tone.** Sharp colleague who has 60 seconds. Not a teacher's pet, not a corporate reviewer, not a hype merchant.
- **Length.** 4–8 short paragraphs at most. The user is mid-task; don't lecture.

What you avoid:

- Generic praise ("great job!").
- Generic critique ("this could be more specific").
- Restating the lesson at them.
- Using the model's "as an AI" filler.
- More than one uncomfortable truth — pick the most useful one.`;

export const dynamic = "force-dynamic";

interface AskBody {
  lessonSlug?: unknown;
  attempt?: unknown;
}

export async function POST(request: Request) {
  let body: AskBody;
  try {
    body = (await request.json()) as AskBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const slug = typeof body.lessonSlug === "string" ? body.lessonSlug.trim() : "";
  const attempt =
    typeof body.attempt === "string" ? body.attempt.trim() : "";

  if (!slug || !attempt) {
    return Response.json(
      { error: "lessonSlug and attempt are required" },
      { status: 400 },
    );
  }
  if (attempt.length > MAX_ATTEMPT_LENGTH) {
    return Response.json(
      {
        error: `Attempt must be ${MAX_ATTEMPT_LENGTH.toLocaleString()} characters or fewer`,
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

  const lesson = getLessonBySlug(slug);
  if (!lesson) {
    return Response.json({ error: "Lesson not found" }, { status: 404 });
  }
  if (!lesson.try_it_rubric) {
    return Response.json(
      { error: "This lesson doesn't have a graded exercise yet." },
      { status: 400 },
    );
  }

  const isMock = process.env.E2E_TEST_MODE === "true";
  if (isMock) {
    return Response.json({
      reply: `[mock-exercise] About "${lesson.title}" — graded against rubric. You wrote ${attempt.length} chars.`,
      model: "mock-exercise",
    });
  }

  const userKey = await getUserApiKey(supabase, "anthropic");
  const apiKey = userKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Exercise feedback is not configured on this server." },
      { status: 500 },
    );
  }

  // The system prompt has the universal coaching guidance. The user
  // message has the lesson-specific rubric + the user's attempt.
  const userMessage = [
    `Lesson title: ${lesson.title}`,
    `\nLesson summary: ${lesson.summary}`,
    `\nGrading rubric:\n${lesson.try_it_rubric}`,
    `\n---\n\nUser's attempt:\n\n${attempt}`,
    `\n\n---\n\nNow give your feedback.`,
  ].join("");

  try {
    const client = new Anthropic({ apiKey });
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });
    const block = resp.content.find((c) => c.type === "text");
    const reply = block && block.type === "text" ? block.text.trim() : "";
    return Response.json({
      reply: reply || "(no response)",
      model: userKey ? `${MODEL}-byok` : MODEL,
    });
  } catch (err) {
    console.error("[learn/exercise] error:", err);
    return Response.json(
      { error: "Feedback failed — please retry." },
      { status: 502 },
    );
  }
}

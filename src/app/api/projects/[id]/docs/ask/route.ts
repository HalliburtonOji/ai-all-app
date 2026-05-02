import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/utils/supabase/server";
import { getUserApiKey } from "@/lib/byok/get-key";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 1500;
const MAX_QUESTION_LENGTH = 2000;

const SYSTEM_PROMPT = `You're the document tutor inside AI All App. The user has uploaded a PDF and is asking you about it. Stay grounded in the document — when an answer isn't supported by the file, say so plainly. When the document doesn't cover what the user asked, name the gap and suggest what they could ask instead.

Tone: direct, plain-English, no hedging preambles. The user is mid-task; respect their time. Don't summarise the entire document unprompted; answer the specific question.

If the user asks for the model's "general knowledge" answer alongside what's in the doc, you can offer that — but mark it clearly: lead with what the document actually says, then flag the supplementary part as "not from the document".

Do not invent quotes, citations, page numbers, or specific numbers that aren't in the source.`;

export const dynamic = "force-dynamic";

interface AskBody {
  documentId?: unknown;
  question?: unknown;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;

  let body: AskBody;
  try {
    body = (await request.json()) as AskBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const documentId =
    typeof body.documentId === "string" ? body.documentId.trim() : "";
  const question =
    typeof body.question === "string" ? body.question.trim() : "";

  if (!documentId) {
    return Response.json({ error: "documentId is required" }, { status: 400 });
  }
  if (!question) {
    return Response.json({ error: "Question is empty" }, { status: 400 });
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return Response.json(
      {
        error: `Question must be ${MAX_QUESTION_LENGTH.toLocaleString()} characters or fewer`,
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

  const { data: doc } = await supabase
    .from("project_documents")
    .select("id, project_id, storage_path, filename, user_id")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc || doc.user_id !== user.id || doc.project_id !== projectId) {
    return Response.json({ error: "Document not found" }, { status: 404 });
  }

  // Mock mode: deterministic reply that proves the wiring works
  // without burning tokens. Includes the filename + first 60 chars
  // of the question so the spec can assert on stable markers.
  const isMock = process.env.E2E_TEST_MODE === "true";
  if (isMock) {
    return Response.json({
      reply: `[mock-doc] About "${doc.filename}" — I received: ${question.slice(0, 60)}`,
      model: "mock-doc",
    });
  }

  // BYOK: prefer user's Anthropic key, else platform.
  const userKey = await getUserApiKey(supabase, "anthropic");
  const apiKey = userKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Document Q&A is not configured on this server." },
      { status: 500 },
    );
  }

  // Pull the PDF from Storage. Use a 60s signed URL to download
  // server-side; never expose the URL to the client.
  const { data: signed } = await supabase.storage
    .from("project-documents")
    .createSignedUrl(doc.storage_path, 60);
  if (!signed?.signedUrl) {
    return Response.json(
      { error: "Could not access the document right now." },
      { status: 500 },
    );
  }

  let pdfBase64: string;
  try {
    const resp = await fetch(signed.signedUrl);
    if (!resp.ok) throw new Error(`fetch failed (${resp.status})`);
    const buf = await resp.arrayBuffer();
    pdfBase64 = Buffer.from(buf).toString("base64");
  } catch (err) {
    console.error("[docs/ask] failed to fetch PDF:", err);
    return Response.json(
      { error: "Could not load the document." },
      { status: 500 },
    );
  }

  try {
    const client = new Anthropic({ apiKey });
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      // Anthropic prompt caching: the document block is cacheable.
      // Repeated questions on the same doc within ~5 minutes cost
      // dramatically less because the document tokens come from the
      // cache. The user message is fresh each time.
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: pdfBase64,
              },
              cache_control: { type: "ephemeral" },
            },
            {
              type: "text",
              text: question,
            },
          ],
        },
      ],
    });
    const textBlock = resp.content.find((c) => c.type === "text");
    const reply =
      textBlock && textBlock.type === "text" ? textBlock.text.trim() : "";
    return Response.json({
      reply: reply || "(no response)",
      model: userKey ? `${MODEL}-byok` : MODEL,
    });
  } catch (err) {
    console.error("[docs/ask] anthropic call failed:", err);
    return Response.json(
      { error: "Document Q&A failed — please retry." },
      { status: 502 },
    );
  }
}

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/utils/supabase/server";
import { COACH_SYSTEM_PROMPT } from "@/lib/coach/system-prompt";
import { buildProjectContext } from "@/lib/coach/build-context";
import type { Project } from "@/types/project";
import type { MessageRole } from "@/types/coach";

const MAX_MESSAGE_LENGTH = 10_000;
const MODEL = "claude-sonnet-4-6";
// Auto-title uses the same Sonnet model as main coach calls, since that's
// confirmed working on Halli's account. Haiku would be cheaper but the
// title call is ~50 output tokens — cost difference is negligible.
const TITLE_MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 2048;
const TITLE_MAX_TOKENS = 50;

// History trimming: when going to the model exceeds this many messages,
// keep only the most recent N. The system prompt + project context are
// sent every turn, so we never lose those.
const HISTORY_TRIM_THRESHOLD = 50;
const HISTORY_KEEP_MOST_RECENT = 40;

const DEFAULT_CONVERSATION_TITLE = "New conversation";

function jsonError(error: string, status: number) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const { conversationId, message } = (body ?? {}) as {
    conversationId?: unknown;
    message?: unknown;
  };

  if (typeof conversationId !== "string" || typeof message !== "string") {
    return jsonError("conversationId and message are required strings", 400);
  }

  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return jsonError("Message cannot be empty.", 400);
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return jsonError(
      `Message must be ${MAX_MESSAGE_LENGTH.toLocaleString()} characters or fewer.`,
      400,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return jsonError("Not authenticated", 401);
  }

  // Verify ownership (RLS would also enforce; defense in depth).
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, project_id, user_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conversation || conversation.user_id !== user.id) {
    return jsonError("Conversation not found", 404);
  }

  const { data: projectRow } = await supabase
    .from("projects")
    .select("*")
    .eq("id", conversation.project_id)
    .maybeSingle();
  if (!projectRow) {
    return jsonError("Project not found", 404);
  }
  const project = projectRow as Project;

  // Load history (only this conversation — threads are context-independent)
  const { data: historyRows } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  let history = (historyRows ?? []) as { role: MessageRole; content: string }[];

  if (history.length > HISTORY_TRIM_THRESHOLD) {
    const trimmedCount = history.length - HISTORY_KEEP_MOST_RECENT;
    history = history.slice(-HISTORY_KEEP_MOST_RECENT);
    console.log(
      `[coach] Trimmed ${trimmedCount} oldest messages from history (kept ${HISTORY_KEEP_MOST_RECENT}). Conversation: ${conversationId}`,
    );
  }

  // Persist the user's message FIRST so we don't lose their text on a stream failure.
  const { error: userInsertErr } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      role: "user",
      content: trimmed,
    });

  if (userInsertErr) {
    console.error("Failed to save user message:", userInsertErr);
    return jsonError("Could not save your message — try again.", 500);
  }

  const encoder = new TextEncoder();
  const isMock = process.env.E2E_TEST_MODE === "true";

  function frame(event: string, data: unknown) {
    return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let fullContent = "";
      let inputTokens: number | null = null;
      let outputTokens: number | null = null;
      let modelUsed = "mock";
      let savedAsPartial = false;

      const savePartial = async () => {
        if (savedAsPartial || fullContent.length === 0) return;
        savedAsPartial = true;
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          role: "assistant",
          content: fullContent,
          model: modelUsed,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          partial: true,
        });
      };

      try {
        if (isMock) {
          // Deterministic mock — emits 4 chunks with small delays so streaming
          // tests can assert visible growth, not just final text.
          const chunks = [
            "[mock] ",
            "I received: ",
            trimmed.slice(0, 25),
            trimmed.length > 25 ? trimmed.slice(25, 50) : "",
          ].filter((c) => c.length > 0);

          for (const chunk of chunks) {
            fullContent += chunk;
            controller.enqueue(frame("text", { delta: chunk }));
            await new Promise((r) => setTimeout(r, 50));
          }
        } else {
          const apiKey = process.env.ANTHROPIC_API_KEY;
          if (!apiKey) {
            controller.enqueue(
              frame("error", {
                message: "The coach is not configured on this server.",
              }),
            );
            controller.close();
            return;
          }

          modelUsed = MODEL;
          const client = new Anthropic({ apiKey });
          const systemMessage =
            COACH_SYSTEM_PROMPT + "\n\n" + buildProjectContext(project);

          const anthroStream = client.messages.stream({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system: systemMessage,
            messages: [
              ...history.map((m) => ({ role: m.role, content: m.content })),
              { role: "user" as const, content: trimmed },
            ],
          });

          for await (const event of anthroStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const delta = event.delta.text;
              fullContent += delta;
              controller.enqueue(frame("text", { delta }));
            }
          }

          const final = await anthroStream.finalMessage();
          inputTokens = final.usage.input_tokens ?? null;
          outputTokens = final.usage.output_tokens ?? null;
        }

        // Persist the complete assistant message.
        const { data: savedAssistant } = await supabase
          .from("messages")
          .insert({
            conversation_id: conversationId,
            role: "assistant",
            content: fullContent,
            model: modelUsed,
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            partial: false,
          })
          .select(
            "id, role, content, model, input_tokens, output_tokens, partial, created_at",
          )
          .single();

        // Auto-title: if this was the first exchange in a conversation that
        // still has the default title, generate a short title from the
        // first user message + assistant reply.
        let newTitle: string | null = null;
        if (history.length === 0) {
          const { data: convForTitle } = await supabase
            .from("conversations")
            .select("title")
            .eq("id", conversationId)
            .maybeSingle();

          if (convForTitle?.title === DEFAULT_CONVERSATION_TITLE) {
            console.log(
              `[coach] auto-title: firing for conversation ${conversationId}`,
            );
            try {
              if (isMock) {
                // Deterministic mock title: first 3 words of the user message.
                const words = trimmed.split(/\s+/).slice(0, 3).join(" ");
                newTitle = (`Mock: ${words}`).slice(0, 60);
              } else {
                const apiKey = process.env.ANTHROPIC_API_KEY;
                if (apiKey) {
                  const titleClient = new Anthropic({ apiKey });
                  // Anthropic requires the messages array to end with a
                  // `user` message, so we collapse the user/assistant
                  // exchange into a single user-role prompt that asks for
                  // the title. We also truncate to ~500 chars per side to
                  // keep the title call cheap.
                  const userSnippet = trimmed.slice(0, 500);
                  const assistantSnippet = fullContent.slice(0, 500);
                  const titleResp = await titleClient.messages.create({
                    model: TITLE_MODEL,
                    max_tokens: TITLE_MAX_TOKENS,
                    system:
                      "You generate a 3–5 word title for a conversation between a user and an AI coach. Output ONLY the title — no quotes, no period, no preamble, no explanation. Title in title case.",
                    messages: [
                      {
                        role: "user",
                        content:
                          "Conversation to title:\n\n" +
                          `User: ${userSnippet}\n\n` +
                          `Coach: ${assistantSnippet}\n\n` +
                          "Reply with the 3–5 word title only.",
                      },
                    ],
                  });
                  const text =
                    titleResp.content[0]?.type === "text"
                      ? titleResp.content[0].text
                      : "";
                  newTitle = text
                    .trim()
                    .replace(/^["'`]+|["'`.]+$/g, "")
                    .slice(0, 100);
                }
              }
            } catch (err) {
              console.error("[coach] auto-title generation failed:", err);
            }

            if (newTitle && newTitle.length > 0) {
              await supabase
                .from("conversations")
                .update({ title: newTitle })
                .eq("id", conversationId);
              console.log(
                `[coach] auto-title: saved "${newTitle}" for conversation ${conversationId}`,
              );
            } else {
              console.warn(
                `[coach] auto-title: empty/missing title for conversation ${conversationId}`,
              );
            }
          }
        }

        // Bump conversation updated_at (the trigger overwrites with now()).
        await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversationId);

        controller.enqueue(
          frame("done", {
            message: savedAssistant,
            title: newTitle,
          }),
        );
      } catch (err) {
        console.error("[coach/stream] error mid-stream:", err);
        await savePartial();
        controller.enqueue(
          frame("error", {
            message:
              err instanceof Error && err.message.includes("rate limit")
                ? "The coach is taking a breather. Try again in a few minutes."
                : "The coach was interrupted — please retry.",
            partial: fullContent.length > 0,
          }),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

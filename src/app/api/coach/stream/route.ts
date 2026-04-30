import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/utils/supabase/server";
import { COACH_SYSTEM_PROMPT } from "@/lib/coach/system-prompt";
import { buildProjectContext } from "@/lib/coach/build-context";
import {
  buildMemoryContext,
  buildUserMemoryContext,
} from "@/lib/coach/build-memory";
import { ALL_COACH_TOOLS } from "@/lib/coach/tool-specs";
import { handleStudioImage } from "@/lib/coach/tool-handlers";
import type { Project } from "@/types/project";
import type { MessageRole, ProjectFact, UserFact } from "@/types/coach";

const MAX_MESSAGE_LENGTH = 10_000;
const MODEL = "claude-sonnet-4-6";
const TITLE_MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 2048;
const TITLE_MAX_TOKENS = 50;

const HISTORY_TRIM_THRESHOLD = 50;
const HISTORY_KEEP_MOST_RECENT = 40;

const DEFAULT_CONVERSATION_TITLE = "New conversation";

// In E2E_TEST_MODE, when the user message matches this regex the mock
// branch simulates a tool-using turn (preamble text + tool_use) so the
// integration path is testable without calling Anthropic.
const MOCK_TOOL_TRIGGER =
  /\b(draw|image|illustrate|picture|logo|sketch|paint|render)\b/i;

const MESSAGE_SELECT =
  "id, role, content, model, input_tokens, output_tokens, partial, tool_call, studio_image_id, created_at";

interface PendingToolUse {
  tool_use_id: string;
  name: string;
  input: Record<string, unknown>;
}

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

  const { data: historyRows } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  let history = (historyRows ?? []) as { role: MessageRole; content: string }[];

  const { data: factRows } = await supabase
    .from("project_facts")
    .select("id, fact, pinned, created_at")
    .eq("project_id", project.id)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  const memoryFacts = (factRows ?? []) as ProjectFact[];

  const { data: userFactRows } = await supabase
    .from("user_facts")
    .select("id, fact, pinned, created_at")
    .eq("user_id", user.id)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  const userFacts = (userFactRows ?? []) as UserFact[];

  if (history.length > HISTORY_TRIM_THRESHOLD) {
    const trimmedCount = history.length - HISTORY_KEEP_MOST_RECENT;
    history = history.slice(-HISTORY_KEEP_MOST_RECENT);
    console.log(
      `[coach] Trimmed ${trimmedCount} oldest messages from history (kept ${HISTORY_KEEP_MOST_RECENT}). Conversation: ${conversationId}`,
    );
  }

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
      let toolUse: PendingToolUse | null = null;

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
          const memorySuffix =
            memoryFacts.length > 0 ? ` [memory: ${memoryFacts.length}]` : "";
          const userMemorySuffix =
            userFacts.length > 0 ? ` [user-memory: ${userFacts.length}]` : "";

          if (MOCK_TOOL_TRIGGER.test(trimmed)) {
            // Tool-using mock turn: emit a short preamble, then signal a tool_use.
            const preambleChunks = [
              "[mock] ",
              "I'll draw that for you",
              memorySuffix,
              userMemorySuffix,
              ".",
            ].filter((c) => c.length > 0);
            for (const chunk of preambleChunks) {
              fullContent += chunk;
              controller.enqueue(frame("text", { delta: chunk }));
              await new Promise((r) => setTimeout(r, 30));
            }
            toolUse = {
              tool_use_id: `mock_tool_${Date.now()}_${Math.random()
                .toString(16)
                .slice(2, 8)}`,
              name: "studio_image_generate",
              input: { prompt: trimmed },
            };
          } else {
            // Existing chatty mock — no tool, just text.
            const chunks = [
              "[mock] ",
              "I received: ",
              trimmed.slice(0, 25),
              trimmed.length > 25 ? trimmed.slice(25, 50) : "",
              memorySuffix,
              userMemorySuffix,
            ].filter((c) => c.length > 0);
            for (const chunk of chunks) {
              fullContent += chunk;
              controller.enqueue(frame("text", { delta: chunk }));
              await new Promise((r) => setTimeout(r, 50));
            }
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
          const memoryContext = buildMemoryContext(memoryFacts);
          const userMemoryContext = buildUserMemoryContext(userFacts);
          const systemMessage =
            COACH_SYSTEM_PROMPT +
            "\n\n" +
            buildProjectContext(project) +
            (memoryContext ? "\n\n" + memoryContext : "") +
            (userMemoryContext ? "\n\n" + userMemoryContext : "");

          const anthroStream = client.messages.stream({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system: systemMessage,
            tools: ALL_COACH_TOOLS,
            tool_choice: { type: "auto" },
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

          if (final.stop_reason === "tool_use") {
            const block = final.content.find((c) => c.type === "tool_use");
            if (block && block.type === "tool_use") {
              toolUse = {
                tool_use_id: block.id,
                name: block.name,
                input: (block.input ?? {}) as Record<string, unknown>,
              };
            }
          }
        }

        // Branch: tool-using turn vs plain-text turn.
        let primaryMessage: unknown = null;

        if (toolUse) {
          const { data: preamble } = await supabase
            .from("messages")
            .insert({
              conversation_id: conversationId,
              role: "assistant",
              content: fullContent,
              model: modelUsed,
              input_tokens: inputTokens,
              output_tokens: outputTokens,
              partial: false,
              tool_call: toolUse,
            })
            .select(MESSAGE_SELECT)
            .single();

          primaryMessage = preamble;
          controller.enqueue(
            frame("tool_started", {
              tool_use_id: toolUse.tool_use_id,
              name: toolUse.name,
              message: preamble,
            }),
          );

          let handlerResult;
          if (toolUse.name === "studio_image_generate") {
            handlerResult = await handleStudioImage(
              supabase,
              user.id,
              project.id,
              toolUse.input as { prompt: unknown },
            );
          } else {
            handlerResult = { error: `Unknown tool: ${toolUse.name}` };
          }

          if ("error" in handlerResult) {
            const { data: errMsg } = await supabase
              .from("messages")
              .insert({
                conversation_id: conversationId,
                role: "assistant",
                content: `[Image generation failed: ${handlerResult.error}]`,
                model: modelUsed,
                partial: false,
              })
              .select(MESSAGE_SELECT)
              .single();
            controller.enqueue(
              frame("tool_failed", {
                tool_use_id: toolUse.tool_use_id,
                error: handlerResult.error,
                message: errMsg,
              }),
            );
          } else {
            const { data: resultMsg } = await supabase
              .from("messages")
              .insert({
                conversation_id: conversationId,
                role: "assistant",
                content: "",
                model: modelUsed,
                partial: false,
                studio_image_id: handlerResult.image_id,
              })
              .select(MESSAGE_SELECT)
              .single();
            const hydrated = resultMsg
              ? {
                  ...resultMsg,
                  studio_image: {
                    id: handlerResult.image_id,
                    signed_url: handlerResult.signed_url,
                    prompt: handlerResult.prompt,
                  },
                }
              : null;
            controller.enqueue(
              frame("tool_result", {
                tool_use_id: toolUse.tool_use_id,
                message: hydrated,
              }),
            );
          }
        } else {
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
            .select(MESSAGE_SELECT)
            .single();
          primaryMessage = savedAssistant;
        }

        // Auto-title for first exchange (unchanged in spirit; uses fullContent
        // as the assistant snippet, which is the preamble for tool turns).
        let newTitle: string | null = null;
        if (history.length === 0) {
          const { data: convForTitle } = await supabase
            .from("conversations")
            .select("title")
            .eq("id", conversationId)
            .maybeSingle();

          if (convForTitle?.title === DEFAULT_CONVERSATION_TITLE) {
            try {
              if (isMock) {
                const words = trimmed.split(/\s+/).slice(0, 3).join(" ");
                newTitle = `Mock: ${words}`.slice(0, 60);
              } else {
                const apiKey = process.env.ANTHROPIC_API_KEY;
                if (apiKey) {
                  const titleClient = new Anthropic({ apiKey });
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
            }
          }
        }

        await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversationId);

        controller.enqueue(
          frame("done", {
            message: primaryMessage,
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

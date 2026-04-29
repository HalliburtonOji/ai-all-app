"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import type { Message } from "@/types/coach";
import { regenerateLastResponse } from "./conversation-actions";

interface CoachProps {
  conversationId: string;
  initialMessages: Message[];
}

interface UIMessage extends Message {
  /** Local-only flag set true while a stream is filling in this message. */
  streaming?: boolean;
}

export function Coach({ conversationId, initialMessages }: CoachProps) {
  const [messages, setMessages] = useState<UIMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSubmittedMessage, setLastSubmittedMessage] = useState<string | null>(
    null,
  );
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isStreaming]);

  /** Core streaming logic. Used by handleSubmit, handleRegenerate, and handleRetry. */
  async function streamMessage(content: string) {
    if (isStreaming) return;
    const trimmed = content.trim();
    if (!trimmed) return;

    setError(null);
    setIsStreaming(true);
    setLastSubmittedMessage(trimmed);

    const optimisticUserId = `temp-user-${Date.now()}`;
    const placeholderId = `streaming-${Date.now()}`;

    const optimisticUser: UIMessage = {
      id: optimisticUserId,
      role: "user",
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    const placeholderAssistant: UIMessage = {
      id: placeholderId,
      role: "assistant",
      content: "",
      created_at: new Date().toISOString(),
      streaming: true,
    };

    setMessages((prev) => [...prev, optimisticUser, placeholderAssistant]);

    try {
      const res = await fetch("/api/coach/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message: trimmed }),
      });

      if (!res.ok) {
        const data: unknown = await res.json().catch(() => ({}));
        const errText =
          data &&
          typeof data === "object" &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Couldn't reach the coach.";
        throw new Error(errText);
      }

      if (!res.body) {
        throw new Error("No response body");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const ev of events) {
          if (!ev) continue;
          let eventName = "";
          let dataLine = "";
          for (const line of ev.split("\n")) {
            if (line.startsWith("event:")) eventName = line.slice(6).trim();
            else if (line.startsWith("data:")) dataLine = line.slice(5).trim();
          }
          if (!eventName || !dataLine) continue;

          let parsed: unknown;
          try {
            parsed = JSON.parse(dataLine);
          } catch {
            continue;
          }

          if (eventName === "text") {
            const delta = (parsed as { delta?: string }).delta ?? "";
            setMessages((prev) =>
              prev.map((m) =>
                m.id === placeholderId
                  ? { ...m, content: m.content + delta }
                  : m,
              ),
            );
          } else if (eventName === "done") {
            const payload = parsed as {
              message: Message | null;
              title?: string | null;
            };
            const final = payload.message;
            if (final) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === placeholderId
                    ? { ...final, streaming: false }
                    : m,
                ),
              );
            } else {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === placeholderId ? { ...m, streaming: false } : m,
                ),
              );
            }
            if (payload.title) {
              router.refresh();
            }
          } else if (eventName === "error") {
            const errPayload = parsed as {
              message?: string;
              partial?: boolean;
            };
            setError(errPayload.message ?? "The coach was interrupted.");
            setMessages((prev) =>
              prev.map((m) =>
                m.id === placeholderId
                  ? { ...m, streaming: false, partial: true }
                  : m,
              ),
            );
          }
        }
      }
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg);
      setMessages((prev) =>
        prev.filter(
          (m) => m.id !== placeholderId && m.id !== optimisticUserId,
        ),
      );
    } finally {
      setIsStreaming(false);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }

  async function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    setInput("");
    await streamMessage(trimmed);
  }

  async function handleRegenerate(assistantMessageId: string) {
    if (isStreaming) return;

    setError(null);
    const result = await regenerateLastResponse(assistantMessageId);
    if (!result.success) {
      setError(result.error);
      return;
    }

    // Trim local state: drop the assistant message + the user message that preceded it.
    setMessages((prev) => {
      const asstIdx = prev.findIndex((m) => m.id === assistantMessageId);
      if (asstIdx === -1) return prev;
      let userIdx = asstIdx - 1;
      while (userIdx >= 0 && prev[userIdx].role !== "user") userIdx--;
      return userIdx >= 0 ? prev.slice(0, userIdx) : prev.slice(0, asstIdx);
    });

    await streamMessage(result.userMessageContent);
  }

  async function handleRetry() {
    if (isStreaming) return;
    if (!lastSubmittedMessage) {
      // Fall back to whatever's in the input
      const trimmed = input.trim();
      if (trimmed) {
        setInput("");
        await streamMessage(trimmed);
      }
      return;
    }
    await streamMessage(lastSubmittedMessage);
  }

  async function handleCopy(messageId: string, content: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(
        () => setCopiedMessageId((id) => (id === messageId ? null : id)),
        1500,
      );
    } catch {
      // Clipboard may be blocked; do nothing — Copy is best-effort.
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  }

  return (
    <section
      data-conversation-id={conversationId}
      className="flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4"
        style={{ minHeight: "400px", maxHeight: "60vh" }}
      >
        {messages.length === 0 && !isStreaming ? (
          <div className="flex h-full min-h-[300px] items-center justify-center px-6 text-center">
            <p className="text-sm italic text-zinc-500 dark:text-zinc-400">
              Ready when you are. What&apos;s on your mind?
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                isCopied={copiedMessageId === m.id}
                onCopy={() => handleCopy(m.id, m.content)}
                onRegenerate={
                  m.role === "assistant" && !m.streaming
                    ? () => handleRegenerate(m.id)
                    : undefined
                }
                disableActions={isStreaming}
              />
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start justify-between gap-3 border-t border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-700 dark:text-red-400">
          <span className="flex-1">{error}</span>
          {lastSubmittedMessage && (
            <button
              type="button"
              onClick={() => void handleRetry()}
              disabled={isStreaming}
              className="shrink-0 rounded border border-red-500/40 bg-white px-2 py-0.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:bg-zinc-950 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              Retry
            </button>
          )}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
        className="border-t border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder="Ask the coach anything…"
            rows={2}
            aria-label="Message to coach"
            className="flex-1 resize-none rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:ring-white"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Send
          </button>
        </div>
        <p className="mt-1.5 text-xs text-zinc-500">
          Enter to send, Shift+Enter for a new line
        </p>
      </form>
    </section>
  );
}

interface MessageBubbleProps {
  message: UIMessage;
  isCopied: boolean;
  onCopy: () => void;
  onRegenerate?: () => void;
  disableActions: boolean;
}

function MessageBubble({
  message,
  isCopied,
  onCopy,
  onRegenerate,
  disableActions,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isStreaming = message.streaming === true;
  const isPartial = message.partial === true;
  const isEmpty = message.content.trim().length === 0;

  const timestamp = new Date(message.created_at).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  // Hide actions while this specific message is streaming OR while it's empty.
  const showActions = !isStreaming && !isEmpty;

  return (
    <div
      className={`group flex ${isUser ? "justify-end" : "justify-start"}`}
      data-message-role={message.role}
      data-streaming={isStreaming ? "true" : "false"}
      data-partial={isPartial ? "true" : "false"}
    >
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm sm:max-w-[75%] ${
          isUser
            ? "whitespace-pre-wrap bg-black text-white dark:bg-white dark:text-black"
            : "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
        }`}
        title={timestamp}
      >
        {isUser ? (
          message.content
        ) : isStreaming && isEmpty ? (
          <span className="italic text-zinc-500">Coach is thinking…</span>
        ) : (
          <>
            <CoachMarkdown content={message.content} />
            {isStreaming && <StreamingCursor />}
          </>
        )}

        {isPartial && !isStreaming && (
          <p className="mt-2 text-xs italic opacity-70">
            Response was interrupted.
          </p>
        )}

        {showActions && (
          <div
            className={`mt-2 flex items-center gap-2 text-xs transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 ${
              isUser
                ? "text-zinc-300 dark:text-zinc-600"
                : "text-zinc-500"
            }`}
          >
            <button
              type="button"
              onClick={onCopy}
              disabled={disableActions}
              className="rounded px-1.5 py-0.5 hover:bg-black/10 disabled:opacity-50 dark:hover:bg-white/10"
              aria-label="Copy message"
            >
              {isCopied ? "Copied!" : "Copy"}
            </button>
            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                disabled={disableActions}
                className="rounded px-1.5 py-0.5 hover:bg-black/10 disabled:opacity-50 dark:hover:bg-white/10"
                aria-label="Regenerate response"
              >
                Regenerate
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StreamingCursor() {
  return (
    <span
      aria-hidden="true"
      className="ml-0.5 inline-block h-3 w-1.5 animate-pulse rounded-sm bg-current align-middle"
    />
  );
}

function CoachMarkdown({ content }: { content: string }) {
  return (
    <div className="space-y-2 leading-6 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="my-2">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-6">{children}</li>,
          h1: ({ children }) => (
            <h1 className="mt-3 mb-1 text-base font-bold">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-3 mb-1 text-base font-bold">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-2 mb-1 text-sm font-bold">{children}</h3>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-2 border-zinc-400 pl-3 italic dark:border-zinc-600">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isBlock = Boolean(className);
            if (isBlock) {
              return (
                <code
                  className={`block overflow-x-auto rounded bg-zinc-200 p-2 font-mono text-xs dark:bg-zinc-800 ${className ?? ""}`}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded bg-zinc-200 px-1 py-0.5 font-mono text-xs dark:bg-zinc-800">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className="my-2">{children}</pre>,
          hr: () => (
            <hr className="my-3 border-zinc-300 dark:border-zinc-700" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

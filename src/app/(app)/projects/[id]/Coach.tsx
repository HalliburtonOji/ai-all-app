"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Message } from "@/types/coach";

interface CoachProps {
  conversationId: string;
  initialMessages: Message[];
}

export function Coach({ conversationId, initialMessages }: CoachProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  async function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    setIsLoading(true);

    const optimisticUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: trimmed,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUserMessage]);
    setInput("");

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message: trimmed }),
      });

      if (!res.ok) {
        const data: unknown = await res.json().catch(() => ({}));
        const errorText =
          (data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : null) ?? "Something went wrong — try again.";
        throw new Error(errorText);
      }

      const assistant = (await res.json()) as Message;
      setMessages((prev) => [...prev, assistant]);
    } catch (err) {
      setError((err as Error).message);
      setInput(trimmed);
      setMessages((prev) =>
        prev.filter((m) => m.id !== optimisticUserMessage.id),
      );
    } finally {
      setIsLoading(false);
      // Refocus the textarea after the next render cycle
      setTimeout(() => textareaRef.current?.focus(), 0);
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
        {messages.length === 0 && !isLoading ? (
          <div className="flex h-full min-h-[300px] items-center justify-center px-6 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Ready when you are. What are you working on?
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-md bg-zinc-100 px-3 py-2 text-sm text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                  Coach is thinking…
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="border-t border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-700 dark:text-red-400">
          {error}
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
            disabled={isLoading}
            placeholder="Ask the coach anything…"
            rows={2}
            aria-label="Message to coach"
            className="flex-1 resize-none rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:ring-white"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
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

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const timestamp = new Date(message.created_at).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm sm:max-w-[75%] ${
          isUser
            ? "whitespace-pre-wrap bg-black text-white dark:bg-white dark:text-black"
            : "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
        }`}
        title={timestamp}
      >
        {isUser ? message.content : <CoachMarkdown content={message.content} />}
      </div>
    </div>
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

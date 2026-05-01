"use client";

import { useState } from "react";

/**
 * Lightweight tutor sidebar for the lesson player. Single-shot
 * exchange — type a question, see the answer. No persistence; the
 * lesson is the durable artifact, the tutor turns are scratch.
 */
export function LessonTutor({
  lessonSlug,
  lessonTitle,
}: {
  lessonSlug: string;
  lessonTitle: string;
  lessonSummary: string;
}) {
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isPending) return;
    setError(null);
    setReply(null);
    setIsPending(true);
    try {
      const res = await fetch("/api/learn/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonSlug, question: trimmed }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Tutor request failed.");
        return;
      }
      setReply(data.reply ?? "");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section
      data-lesson-tutor="true"
      data-lesson-tutor-slug={lessonSlug}
      className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="text-sm font-semibold text-black dark:text-white">
        Ask the tutor
      </h2>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
        Stuck on something in <span className="italic">{lessonTitle}</span>?
        The tutor knows what you&apos;re reading.
      </p>

      <form onSubmit={onSubmit} className="mt-3">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          maxLength={2_000}
          placeholder="What's confusing here?"
          data-lesson-tutor-input="true"
          disabled={isPending}
          className="block w-full resize-none rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black placeholder:text-zinc-400 focus:border-black focus:outline-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
        />
        <button
          type="submit"
          disabled={isPending || question.trim().length === 0}
          data-lesson-tutor-submit="true"
          className="mt-2 w-full rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {isPending ? "Thinking…" : "Ask"}
        </button>
      </form>

      {error && (
        <p
          role="alert"
          data-lesson-tutor-error="true"
          className="mt-3 text-xs text-red-700 dark:text-red-400"
        >
          {error}
        </p>
      )}

      {reply && (
        <p
          data-lesson-tutor-reply="true"
          className="mt-3 whitespace-pre-wrap rounded bg-zinc-100 p-3 text-sm text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
        >
          {reply}
        </p>
      )}
    </section>
  );
}

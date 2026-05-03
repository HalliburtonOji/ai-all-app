"use client";

import { useState } from "react";

const MAX_ATTEMPT_LEN = 6_000;

/**
 * Exercise submitter for the lesson player. Only rendered when the
 * lesson has a `try_it_rubric` in frontmatter. POSTs to
 * /api/learn/exercise; coach response shows inline beneath. The
 * exchange is ephemeral by design — the lesson is the durable
 * artifact, the practice is the user's.
 */
export function LessonExercise({
  lessonSlug,
  prompt,
}: {
  lessonSlug: string;
  prompt: string | null;
}) {
  const [attempt, setAttempt] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = attempt.trim();
    if (!trimmed || isPending) return;
    setError(null);
    setReply(null);
    setIsPending(true);
    try {
      const res = await fetch("/api/learn/exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonSlug, attempt: trimmed }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Feedback failed.");
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
      data-lesson-exercise="true"
      data-lesson-exercise-slug={lessonSlug}
      className="mt-10 rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-5"
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: "var(--learn-accent)" }}
        />
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Try it — graded
        </p>
      </div>
      <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
        {prompt ??
          "Submit your attempt at the exercise. The coach will give you specific feedback against the lesson's rubric."}
      </p>

      <form onSubmit={onSubmit} className="mt-3">
        <textarea
          value={attempt}
          onChange={(e) => setAttempt(e.target.value)}
          rows={6}
          maxLength={MAX_ATTEMPT_LEN}
          placeholder="Paste your attempt here…"
          data-lesson-exercise-input="true"
          disabled={isPending}
          className="block w-full resize-y rounded-md border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-zinc-400 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)] disabled:opacity-50"
        />
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            {attempt.length.toLocaleString()} / {MAX_ATTEMPT_LEN.toLocaleString()} chars
          </p>
          <button
            type="submit"
            disabled={isPending || attempt.trim().length === 0}
            data-lesson-exercise-submit="true"
            className="rounded-md bg-[var(--brand)] px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--brand-strong)] disabled:opacity-50"
          >
            {isPending ? "Reading…" : "Submit for feedback"}
          </button>
        </div>
      </form>

      {error && (
        <p
          role="alert"
          data-lesson-exercise-error="true"
          className="mt-3 text-xs text-red-700 dark:text-red-400"
        >
          {error}
        </p>
      )}

      {reply && (
        <div
          data-lesson-exercise-reply="true"
          className="prose prose-zinc mt-4 max-w-none rounded-md bg-[var(--surface-muted)] p-4 dark:prose-invert prose-p:my-2 prose-p:text-sm"
        >
          {reply.split(/\n\n+/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      )}
    </section>
  );
}

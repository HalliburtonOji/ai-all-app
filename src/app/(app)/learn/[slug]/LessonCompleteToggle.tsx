"use client";

import { useState, useTransition } from "react";
import { setLessonComplete } from "../actions";

export function LessonCompleteToggle({
  slug,
  isComplete,
}: {
  slug: string;
  isComplete: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [justCompleted, setJustCompleted] = useState(false);

  function onSubmit(formData: FormData) {
    const willComplete = formData.get("completed") === "true";
    startTransition(async () => {
      await setLessonComplete(formData);
      if (willComplete) {
        setJustCompleted(true);
        // Brief celebration window — long enough to register, short
        // enough that it doesn't feel like a delay if the user
        // immediately moves on.
        setTimeout(() => setJustCompleted(false), 1500);
      }
    });
  }

  return (
    <>
      <form action={onSubmit} className="mt-3">
        <input type="hidden" name="slug" value={slug} />
        <input
          type="hidden"
          name="completed"
          value={isComplete ? "false" : "true"}
        />
        <button
          type="submit"
          disabled={isPending}
          data-lesson-toggle-complete="true"
          className={
            isComplete
              ? "w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)] disabled:opacity-50"
              : `w-full rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-800 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500 ${justCompleted ? "celebrate" : ""}`
          }
        >
          {isPending
            ? "Saving…"
            : isComplete
              ? "Mark as not done"
              : "Mark as complete"}
        </button>
      </form>

      {justCompleted && (
        <p
          data-lesson-just-completed="true"
          className="celebrate mt-2 rounded-md bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          ✓ Done. One closer to genuinely good.
        </p>
      )}
    </>
  );
}

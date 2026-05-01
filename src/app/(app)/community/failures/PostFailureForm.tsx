"use client";

import { useState, useTransition } from "react";
import { postFailureNote } from "./actions";

export function PostFailureForm() {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await postFailureNote(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setBody("");
      // Re-grab the form via DOM to clear the field.
      const form = document.querySelector<HTMLFormElement>(
        '[data-failure-post-form="true"]',
      );
      form?.reset();
    });
  }

  const remaining = 2_000 - body.length;
  const tooLong = remaining < 0;

  return (
    <form
      action={onSubmit}
      data-failure-post-form="true"
      className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="text-sm font-semibold text-black dark:text-white">
        Share a failure
      </h2>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
        What didn&apos;t work? What did you learn? Keep it honest, not
        performative.
      </p>
      <textarea
        name="body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        maxLength={2_000}
        placeholder="The pitch I sent never got a reply. Here's what I think went wrong…"
        data-failure-post-input="true"
        className="mt-3 block w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black placeholder:text-zinc-400 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
      />
      <div className="mt-2 flex items-center justify-between">
        <p
          className={
            tooLong
              ? "text-xs text-red-700 dark:text-red-400"
              : "text-xs text-zinc-500"
          }
          data-failure-post-counter="true"
        >
          {remaining} characters left
        </p>
        <button
          type="submit"
          disabled={isPending || body.trim().length === 0 || tooLong}
          data-failure-post-submit="true"
          className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {isPending ? "Posting…" : "Post"}
        </button>
      </div>
      {error && (
        <p
          role="alert"
          data-failure-post-error="true"
          className="mt-2 text-xs text-red-700 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </form>
  );
}

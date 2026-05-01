"use client";

import { useState, useTransition } from "react";
import { deleteFailureNote } from "./actions";

interface FailureRowProps {
  id: string;
  body: string;
  username: string | null;
  createdAt: string;
  isOwner: boolean;
}

export function FailureRow({
  id,
  body,
  username,
  createdAt,
  isOwner,
}: FailureRowProps) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete(formData: FormData) {
    startTransition(async () => {
      await deleteFailureNote(formData);
    });
  }

  const date = new Date(createdAt);
  const dateLabel = date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <li
      data-failure-id={id}
      data-failure-owner={isOwner ? "true" : "false"}
      className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <p className="whitespace-pre-wrap text-sm text-black dark:text-white">
        {body}
      </p>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-zinc-600 dark:text-zinc-400">
        <span>
          {username ? (
            <span>
              by {username} · {dateLabel}
            </span>
          ) : (
            <span>{dateLabel}</span>
          )}
        </span>

        {isOwner &&
          (confirming ? (
            <form action={handleDelete} className="flex items-center gap-2">
              <input type="hidden" name="id" value={id} />
              <button
                type="submit"
                disabled={isPending}
                data-failure-confirm-delete="true"
                className="rounded-md border border-red-300 bg-white px-2 py-0.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:bg-zinc-950 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-md px-2 py-0.5 text-xs text-zinc-600 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/5"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              data-failure-delete="true"
              aria-label="Delete failure note"
              className="rounded-md px-2 py-0.5 text-xs text-zinc-600 hover:bg-black/5 hover:text-red-700 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-red-400"
            >
              Delete
            </button>
          ))}
      </div>
    </li>
  );
}

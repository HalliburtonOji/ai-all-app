"use client";

import { useState, useTransition } from "react";
import type { UserFact } from "@/types/coach";
import {
  updateUserFact,
  deleteUserFact,
  togglePinUserFact,
} from "./user-fact-actions";

interface UserFactItemProps {
  fact: UserFact;
}

type Mode = "display" | "edit" | "confirmDelete";

export function UserFactItem({ fact }: UserFactItemProps) {
  const [mode, setMode] = useState<Mode>("display");
  const [isPending, startTransition] = useTransition();

  const containerClass = `rounded-md border bg-white p-3 dark:bg-zinc-950 ${
    fact.pinned
      ? "border-amber-500/40 bg-amber-50/40 dark:border-amber-500/30 dark:bg-amber-950/10"
      : "border-zinc-200 dark:border-zinc-800"
  }`;

  if (mode === "edit") {
    return (
      <li className={containerClass} data-user-fact-id={fact.id}>
        <form
          action={(formData: FormData) =>
            startTransition(async () => {
              await updateUserFact(formData);
              setMode("display");
            })
          }
          className="space-y-2"
        >
          <input type="hidden" name="id" value={fact.id} />
          <textarea
            name="fact"
            defaultValue={fact.fact}
            required
            minLength={1}
            maxLength={500}
            rows={3}
            autoFocus
            disabled={isPending}
            aria-label="Edit user fact text"
            className="w-full resize-none rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black dark:border-zinc-600 dark:bg-zinc-900 dark:text-white dark:focus:ring-white"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded bg-black px-3 py-1 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setMode("display")}
              disabled={isPending}
              className="rounded border border-zinc-300 px-3 py-1 text-xs text-black hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  if (mode === "confirmDelete") {
    return (
      <li
        className="rounded-md border border-red-500/40 bg-red-50 p-3 dark:bg-red-950/20"
        data-user-fact-id={fact.id}
      >
        <p className="text-sm text-red-800 dark:text-red-300">
          Delete this fact? This cannot be undone.
        </p>
        <div className="mt-2 flex gap-2">
          <form action={deleteUserFact}>
            <input type="hidden" name="id" value={fact.id} />
            <button
              type="submit"
              className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
            >
              Yes, delete
            </button>
          </form>
          <button
            type="button"
            onClick={() => setMode("display")}
            className="rounded border border-zinc-300 px-3 py-1 text-xs text-black hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li
      className={`group ${containerClass}`}
      data-user-fact-id={fact.id}
      data-pinned={fact.pinned ? "true" : "false"}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="flex-1 text-sm leading-6 text-black dark:text-white">
          {fact.fact}
        </p>
        {fact.pinned && (
          <span aria-label="Pinned" title="Pinned" className="shrink-0 text-xs">
            📌
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-end gap-0.5 text-xs opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
        <form action={togglePinUserFact} className="contents">
          <input type="hidden" name="id" value={fact.id} />
          <input
            type="hidden"
            name="currently_pinned"
            value={fact.pinned ? "true" : "false"}
          />
          <button
            type="submit"
            aria-label={fact.pinned ? "Unpin user fact" : "Pin user fact"}
            className="rounded px-1.5 py-0.5 text-zinc-500 hover:bg-black/10 hover:text-black dark:hover:bg-white/10 dark:hover:text-white"
          >
            {fact.pinned ? "Unpin" : "Pin"}
          </button>
        </form>
        <button
          type="button"
          aria-label="Edit user fact"
          onClick={() => setMode("edit")}
          className="rounded px-1.5 py-0.5 text-zinc-500 hover:bg-black/10 hover:text-black dark:hover:bg-white/10 dark:hover:text-white"
        >
          Edit
        </button>
        <button
          type="button"
          aria-label="Delete user fact"
          onClick={() => setMode("confirmDelete")}
          className="rounded px-1.5 py-0.5 text-zinc-500 hover:bg-black/10 hover:text-red-600 dark:hover:bg-white/10 dark:hover:text-red-400"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

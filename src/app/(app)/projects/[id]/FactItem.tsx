"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { ProjectFact } from "@/types/coach";
import { updateFact, deleteFact, togglePinFact } from "./fact-actions";

interface FactItemProps {
  fact: ProjectFact;
  projectId: string;
}

type Mode = "display" | "edit" | "confirmDelete";

export function FactItem({ fact, projectId }: FactItemProps) {
  const [mode, setMode] = useState<Mode>("display");
  const [isPending, startTransition] = useTransition();

  const containerClass = `rounded-md border bg-white p-3 dark:bg-zinc-950 ${
    fact.pinned
      ? "border-amber-500/40 bg-amber-50/40 dark:border-amber-500/30 dark:bg-amber-950/10"
      : "border-zinc-200 dark:border-zinc-800"
  }`;

  if (mode === "edit") {
    return (
      <li className={containerClass} data-fact-id={fact.id}>
        <form
          action={(formData: FormData) =>
            startTransition(async () => {
              await updateFact(formData);
              setMode("display");
            })
          }
          className="space-y-2"
        >
          <input type="hidden" name="id" value={fact.id} />
          <input type="hidden" name="project_id" value={projectId} />
          <textarea
            name="fact"
            defaultValue={fact.fact}
            required
            minLength={1}
            maxLength={500}
            rows={3}
            autoFocus
            disabled={isPending}
            aria-label="Edit fact text"
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
        data-fact-id={fact.id}
      >
        <p className="text-sm text-red-800 dark:text-red-300">
          Delete this fact? This cannot be undone.
        </p>
        <div className="mt-2 flex gap-2">
          <form action={deleteFact}>
            <input type="hidden" name="id" value={fact.id} />
            <input type="hidden" name="project_id" value={projectId} />
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
      data-fact-id={fact.id}
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
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
          <span>Learned {formatRelative(fact.created_at)}</span>
          {fact.source_thread_id && (
            <Link
              href={`/projects/${projectId}?conversation=${fact.source_thread_id}`}
              className="underline-offset-2 hover:underline"
            >
              from this thread
            </Link>
          )}
        </div>

        <div className="flex items-center gap-0.5 text-xs opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
          <form action={togglePinFact} className="contents">
            <input type="hidden" name="id" value={fact.id} />
            <input type="hidden" name="project_id" value={projectId} />
            <input
              type="hidden"
              name="currently_pinned"
              value={fact.pinned ? "true" : "false"}
            />
            <button
              type="submit"
              aria-label={fact.pinned ? "Unpin fact" : "Pin fact"}
              className="rounded px-1.5 py-0.5 text-zinc-500 hover:bg-black/10 hover:text-black dark:hover:bg-white/10 dark:hover:text-white"
            >
              {fact.pinned ? "Unpin" : "Pin"}
            </button>
          </form>
          <button
            type="button"
            aria-label="Edit fact"
            onClick={() => setMode("edit")}
            className="rounded px-1.5 py-0.5 text-zinc-500 hover:bg-black/10 hover:text-black dark:hover:bg-white/10 dark:hover:text-white"
          >
            Edit
          </button>
          <button
            type="button"
            aria-label="Delete fact"
            onClick={() => setMode("confirmDelete")}
            className="rounded px-1.5 py-0.5 text-zinc-500 hover:bg-black/10 hover:text-red-600 dark:hover:bg-white/10 dark:hover:text-red-400"
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const seconds = Math.round((now - then) / 1000);

  if (seconds < 30) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

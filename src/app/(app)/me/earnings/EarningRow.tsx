"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { deleteEarning } from "./actions";
import { formatAmount, type Earning } from "@/types/earnings";

interface ProjectLookup {
  [id: string]: string;
}

export function EarningRow({
  earning,
  projects,
}: {
  earning: Earning;
  projects: ProjectLookup;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete(formData: FormData) {
    startTransition(async () => {
      await deleteEarning(formData);
    });
  }

  const projectName = earning.project_id ? projects[earning.project_id] : null;

  return (
    <li
      data-earning-id={earning.id}
      data-earning-currency={earning.currency}
      className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 py-3 last:border-b-0 dark:border-zinc-800"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span
            className="text-base font-semibold text-black dark:text-white"
            data-earning-amount={earning.amount_cents}
          >
            {formatAmount(earning.amount_cents, earning.currency)}
          </span>
          <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {earning.currency}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-zinc-700 dark:text-zinc-300">
          {earning.source}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
          <span>{earning.occurred_on}</span>
          {projectName && (
            <>
              <span aria-hidden>·</span>
              <Link
                href={`/projects/${earning.project_id}`}
                className="underline-offset-2 hover:underline"
              >
                {projectName}
              </Link>
            </>
          )}
          {earning.note && (
            <>
              <span aria-hidden>·</span>
              <span className="italic">{earning.note}</span>
            </>
          )}
        </div>
      </div>

      {confirming ? (
        <form action={handleDelete} className="flex items-center gap-2">
          <input type="hidden" name="id" value={earning.id} />
          <span className="text-xs text-zinc-700 dark:text-zinc-300">
            Delete this entry?
          </span>
          <button
            type="submit"
            disabled={isPending}
            data-earning-confirm-delete="true"
            className="rounded-md border border-red-300 bg-white px-2 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:bg-zinc-950 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            Yes, delete
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label="Delete earning"
          data-earning-delete="true"
          className="rounded-md px-2 py-1 text-xs text-zinc-600 transition-colors hover:bg-black/10 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-red-400"
        >
          Delete
        </button>
      )}
    </li>
  );
}

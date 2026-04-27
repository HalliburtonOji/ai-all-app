"use client";

import { useState } from "react";
import { deleteProject } from "../actions";

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-md border border-red-500/40 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:bg-zinc-950 dark:text-red-400 dark:hover:bg-red-950/30"
      >
        Delete project
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-red-500/40 bg-red-50 p-4 dark:bg-red-950/20">
      <p className="text-sm font-medium text-red-800 dark:text-red-300">
        Are you sure? This cannot be undone.
      </p>
      <div className="flex gap-2">
        <form action={deleteProject}>
          <input type="hidden" name="id" value={projectId} />
          <button
            type="submit"
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Yes, delete
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { deleteClientRecord } from "../actions";

export function DeleteClientButton({ clientId }: { clientId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onDelete(formData: FormData) {
    startTransition(async () => {
      await deleteClientRecord(formData);
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        data-client-delete="true"
        className="rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-black/5 hover:text-red-700 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-red-400"
      >
        Delete client
      </button>
    );
  }

  return (
    <form action={onDelete} className="flex items-center gap-2">
      <input type="hidden" name="id" value={clientId} />
      <span className="text-xs text-zinc-700 dark:text-zinc-300">
        Delete this client?
      </span>
      <button
        type="submit"
        disabled={isPending}
        data-client-confirm-delete="true"
        className="rounded-md border border-red-300 bg-white px-2 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:bg-zinc-950 dark:text-red-400 dark:hover:bg-red-950/30"
      >
        Yes, delete
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-md px-2 py-1 text-xs text-zinc-700 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/5"
      >
        Cancel
      </button>
    </form>
  );
}

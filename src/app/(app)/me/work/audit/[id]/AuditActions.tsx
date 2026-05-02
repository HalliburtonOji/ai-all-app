"use client";

import { useState, useTransition } from "react";
import { regenerateAuditSummary, deleteJobAudit } from "../../actions";

export function AuditActions({ auditId }: { auditId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function regen(formData: FormData) {
    startTransition(async () => {
      await regenerateAuditSummary(formData);
    });
  }

  function del(formData: FormData) {
    startTransition(async () => {
      await deleteJobAudit(formData);
    });
  }

  return (
    <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-800">
      <form action={regen}>
        <input type="hidden" name="id" value={auditId} />
        <button
          type="submit"
          disabled={isPending}
          data-audit-regenerate="true"
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {isPending ? "Working…" : "Regenerate"}
        </button>
      </form>

      {confirming ? (
        <form action={del} className="flex items-center gap-2">
          <input type="hidden" name="id" value={auditId} />
          <span className="text-xs text-zinc-700 dark:text-zinc-300">
            Delete this audit?
          </span>
          <button
            type="submit"
            disabled={isPending}
            data-audit-confirm-delete="true"
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
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          data-audit-delete="true"
          className="rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-black/5 hover:text-red-700 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-red-400"
        >
          Delete audit
        </button>
      )}
    </div>
  );
}

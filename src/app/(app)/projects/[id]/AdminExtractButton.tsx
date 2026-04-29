"use client";

import { useState, useTransition } from "react";
import { manuallyExtractFacts } from "./extraction-actions";

interface AdminExtractButtonProps {
  projectId: string;
}

export function AdminExtractButton({ projectId }: AdminExtractButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleClick() {
    setFeedback(null);
    startTransition(async () => {
      const result = await manuallyExtractFacts(projectId);
      if ("error" in result) {
        setFeedback(`Error: ${result.error}`);
        return;
      }
      const parts: string[] = [];
      if (result.newFactsCount > 0) {
        parts.push(`${result.newFactsCount} new`);
      }
      if (result.droppedFactsCount > 0) {
        parts.push(`${result.droppedFactsCount} dropped`);
      }
      if (result.skippedReason) {
        parts.push(`skipped (${result.skippedReason.replace(/_/g, " ")})`);
      }
      setFeedback(
        parts.length > 0 ? parts.join(", ") : "No new facts to add.",
      );
    });
  }

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          Admin: manual extraction
        </span>
        {feedback && (
          <span className="text-zinc-500 dark:text-zinc-400">{feedback}</span>
        )}
      </div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        data-extract-button="true"
        className="shrink-0 rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {isPending ? "Running…" : "Run extraction now"}
      </button>
    </div>
  );
}

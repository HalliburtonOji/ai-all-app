"use client";

import { useState, useTransition } from "react";
import { deleteProjectDocument } from "./actions";
import type { ProjectDocument } from "@/types/documents";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentRow({
  doc,
  projectId,
  selected,
  onSelect,
}: {
  doc: ProjectDocument;
  projectId: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete(formData: FormData) {
    startTransition(async () => {
      await deleteProjectDocument(formData);
    });
  }

  return (
    <li
      data-doc-id={doc.id}
      data-doc-selected={selected ? "true" : "false"}
      className={
        "rounded-lg border p-3 transition-colors " +
        (selected
          ? "border-[var(--brand)] bg-[var(--brand-soft)]/40"
          : "border-[var(--border-soft)] bg-[var(--surface)] hover:border-[var(--border-strong)]")
      }
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={onSelect}
          data-doc-select="true"
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate text-sm font-semibold text-[var(--foreground)]">
            {doc.filename}
          </p>
          <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
            {formatBytes(doc.size_bytes)}
            {doc.signed_url && (
              <>
                {" · "}
                <a
                  href={doc.signed_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="underline-offset-2 hover:underline"
                >
                  Open original
                </a>
              </>
            )}
          </p>
        </button>

        {confirming ? (
          <form action={handleDelete} className="flex items-center gap-1">
            <input type="hidden" name="id" value={doc.id} />
            <input type="hidden" name="project_id" value={projectId} />
            <button
              type="submit"
              disabled={isPending}
              data-doc-confirm-delete="true"
              className="rounded-md border border-red-300 bg-white px-2 py-0.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:bg-zinc-950 dark:text-red-400"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setConfirming(false);
              }}
              className="rounded-md px-2 py-0.5 text-xs text-zinc-600 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/5"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setConfirming(true);
            }}
            data-doc-delete="true"
            aria-label="Delete document"
            className="rounded-md px-2 py-0.5 text-xs text-zinc-600 hover:bg-black/5 hover:text-red-700 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-red-400"
          >
            Delete
          </button>
        )}
      </div>
    </li>
  );
}

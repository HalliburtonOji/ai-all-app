"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  renameConversation,
  deleteConversation,
} from "./conversation-actions";

export interface ConversationItemData {
  id: string;
  title: string;
  updated_at: string;
}

interface ConversationItemProps {
  conversation: ConversationItemData;
  projectId: string;
  isCurrent: boolean;
}

type Mode = "display" | "rename" | "confirmDelete";

export function ConversationItem({
  conversation,
  projectId,
  isCurrent,
}: ConversationItemProps) {
  const [mode, setMode] = useState<Mode>("display");
  const [isPending, startTransition] = useTransition();

  const baseClass = `block rounded-md transition-colors ${
    isCurrent
      ? "bg-zinc-100 dark:bg-zinc-800"
      : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
  }`;

  if (mode === "rename") {
    return (
      <li className="group">
        <form
          action={(formData: FormData) =>
            startTransition(async () => {
              await renameConversation(formData);
              setMode("display");
            })
          }
          className={`flex flex-col gap-2 rounded-md p-2 ${
            isCurrent ? "bg-zinc-100 dark:bg-zinc-800" : ""
          }`}
        >
          <input type="hidden" name="id" value={conversation.id} />
          <input type="hidden" name="project_id" value={projectId} />
          <input
            type="text"
            name="title"
            defaultValue={conversation.title}
            required
            minLength={1}
            maxLength={200}
            autoFocus
            disabled={isPending}
            aria-label="New conversation title"
            className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black dark:border-zinc-600 dark:bg-zinc-900 dark:text-white dark:focus:ring-white"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded bg-black px-2 py-1 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setMode("display")}
              disabled={isPending}
              className="rounded border border-zinc-300 px-2 py-1 text-xs text-black hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
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
      <li>
        <div
          className={`flex flex-col gap-2 rounded-md border border-red-500/40 bg-red-50 p-2 dark:bg-red-950/20`}
        >
          <p className="text-xs text-red-800 dark:text-red-300">
            Delete this conversation? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <form action={deleteConversation}>
              <input type="hidden" name="id" value={conversation.id} />
              <input type="hidden" name="project_id" value={projectId} />
              <button
                type="submit"
                className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
              >
                Yes, delete
              </button>
            </form>
            <button
              type="button"
              onClick={() => setMode("display")}
              className="rounded border border-zinc-300 px-2 py-1 text-xs text-black hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="group flex items-stretch">
      <Link
        href={`/projects/${projectId}?conversation=${conversation.id}`}
        aria-current={isCurrent ? "page" : undefined}
        className={`${baseClass} min-w-0 flex-1 px-3 py-2`}
      >
        <div className="truncate text-sm font-medium text-black dark:text-white">
          {conversation.title || "New conversation"}
        </div>
        <div className="mt-0.5 text-xs text-zinc-500">
          {formatRelative(conversation.updated_at)}
        </div>
      </Link>
      <div className="flex shrink-0 items-start gap-0.5 px-1 pt-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
        <button
          type="button"
          aria-label="Rename conversation"
          title="Rename"
          onClick={() => setMode("rename")}
          className="rounded p-1 text-xs text-zinc-500 hover:bg-zinc-200 hover:text-black dark:hover:bg-zinc-700 dark:hover:text-white"
        >
          Rename
        </button>
        <button
          type="button"
          aria-label="Delete conversation"
          title="Delete"
          onClick={() => setMode("confirmDelete")}
          className="rounded p-1 text-xs text-zinc-500 hover:bg-zinc-200 hover:text-red-600 dark:hover:bg-zinc-700 dark:hover:text-red-400"
        >
          Delete
        </button>
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

import Link from "next/link";
import Image from "next/image";
import type { StudioOutput, StudioOutputKind } from "@/types/studio";

interface RecentConversation {
  id: string;
  title: string | null;
  preview: string | null;
  updated_at: string;
}

interface RecentActivityStripProps {
  projectId: string;
  recentOutputs: StudioOutput[];
  recentConversation: RecentConversation | null;
}

const KIND_TO_TOOL: Record<StudioOutputKind, string> = {
  image: "image",
  text: "text",
  audio: "voice",
};

const KIND_GLYPH: Record<StudioOutputKind, string> = {
  image: "🖼️",
  text: "T",
  audio: "♪",
};

/**
 * Compact strip below the project header. Up to 3 most-recent Studio
 * outputs as thumbnails on the left (clicking each jumps to the
 * relevant tool panel), latest assistant-message preview on the right.
 * Hidden when the project has no activity at all.
 */
export function RecentActivityStrip({
  projectId,
  recentOutputs,
  recentConversation,
}: RecentActivityStripProps) {
  const hasOutputs = recentOutputs.length > 0;
  const hasConversation = recentConversation !== null;

  if (!hasOutputs && !hasConversation) return null;

  return (
    <section
      data-recent-activity-strip="true"
      aria-label="Recent activity in this project"
      className="mt-4 flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-950"
    >
      {hasOutputs && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Recent
          </span>
          <span className="flex items-center gap-1.5">
            {recentOutputs.slice(0, 3).map((o) => (
              <Link
                key={o.id}
                href={`/projects/${projectId}?tab=studio&studio=${KIND_TO_TOOL[o.kind]}`}
                data-recent-activity-thumb={o.id}
                data-recent-activity-thumb-kind={o.kind}
                aria-label={`Open ${o.kind} in Studio`}
                className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                {o.kind === "image" && o.signed_url ? (
                  <Image
                    src={o.signed_url}
                    alt={o.prompt}
                    fill
                    unoptimized
                    sizes="36px"
                    className="object-cover"
                  />
                ) : (
                  <span aria-hidden>{KIND_GLYPH[o.kind]}</span>
                )}
              </Link>
            ))}
          </span>
        </div>
      )}

      {hasConversation && recentConversation && (
        <Link
          href={`/projects/${projectId}?conversation=${recentConversation.id}`}
          aria-label="Open latest conversation"
          data-recent-activity-conversation={recentConversation.id}
          className="flex min-w-0 items-center gap-2 text-xs text-zinc-600 hover:text-black dark:text-zinc-300 dark:hover:text-white"
        >
          <span className="font-medium text-zinc-500 dark:text-zinc-400">
            Last conversation
          </span>
          <span className="truncate">
            {recentConversation.title ||
              recentConversation.preview ||
              "Untitled thread"}
          </span>
        </Link>
      )}
    </section>
  );
}

import Link from "next/link";
import Image from "next/image";
import type { StudioImage } from "@/types/studio";

interface RecentConversation {
  id: string;
  title: string | null;
  preview: string | null;
  updated_at: string;
}

interface RecentActivityStripProps {
  projectId: string;
  recentImages: StudioImage[];
  recentConversation: RecentConversation | null;
}

/**
 * A compact strip below the project header that shows the user's most
 * recent activity in this project — a few image thumbnails on the left,
 * a one-line conversation pointer on the right. Hidden entirely when
 * the project has no activity yet (no clutter on a fresh project).
 *
 * Click any thumbnail to jump to the Studio gallery; click the
 * conversation row to open the latest thread.
 */
export function RecentActivityStrip({
  projectId,
  recentImages,
  recentConversation,
}: RecentActivityStripProps) {
  const hasImages = recentImages.length > 0;
  const hasConversation = recentConversation !== null;

  if (!hasImages && !hasConversation) return null;

  return (
    <section
      data-recent-activity-strip="true"
      aria-label="Recent activity in this project"
      className="mt-4 flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-950"
    >
      {hasImages && (
        <Link
          href={`/projects/${projectId}?tab=studio`}
          aria-label="View Studio gallery"
          className="flex items-center gap-2"
        >
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Recent images
          </span>
          <span className="flex items-center gap-1.5">
            {recentImages.slice(0, 3).map((img) => (
              <span
                key={img.id}
                data-recent-activity-thumb={img.id}
                className="relative inline-block h-9 w-9 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <Image
                  src={img.signed_url}
                  alt={img.prompt}
                  fill
                  unoptimized
                  sizes="36px"
                  className="object-cover"
                />
              </span>
            ))}
          </span>
        </Link>
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

import Link from "next/link";

export type ProjectTab = "coach" | "memory" | "studio";

interface ProjectTabsProps {
  projectId: string;
  currentTab: ProjectTab;
  factCount: number;
  imageCount: number;
  currentConversationId: string | null;
}

export function ProjectTabs({
  projectId,
  currentTab,
  factCount,
  imageCount,
  currentConversationId,
}: ProjectTabsProps) {
  // Coach is the default; we drop ?tab=coach from the URL when navigating
  // there. The conversation param is preserved when known.
  const coachQuery = currentConversationId
    ? `?conversation=${currentConversationId}`
    : "";
  const coachUrl = `/projects/${projectId}${coachQuery}`;

  const memoryParams = new URLSearchParams();
  memoryParams.set("tab", "memory");
  if (currentConversationId) {
    memoryParams.set("conversation", currentConversationId);
  }
  const memoryUrl = `/projects/${projectId}?${memoryParams.toString()}`;

  const studioParams = new URLSearchParams();
  studioParams.set("tab", "studio");
  if (currentConversationId) {
    studioParams.set("conversation", currentConversationId);
  }
  const studioUrl = `/projects/${projectId}?${studioParams.toString()}`;

  return (
    <nav
      aria-label="Project view"
      className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800"
    >
      <TabLink
        href={coachUrl}
        active={currentTab === "coach"}
        label="Coach"
      />
      <TabLink
        href={memoryUrl}
        active={currentTab === "memory"}
        label="Memory"
        badge={
          factCount > 0
            ? `Remembering ${factCount} ${factCount === 1 ? "thing" : "things"}`
            : undefined
        }
      />
      <TabLink
        href={studioUrl}
        active={currentTab === "studio"}
        label="Studio"
        badge={
          imageCount > 0
            ? `${imageCount} ${imageCount === 1 ? "image" : "images"}`
            : undefined
        }
      />
    </nav>
  );
}

function TabLink({
  href,
  active,
  label,
  badge,
}: {
  href: string;
  active: boolean;
  label: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "text-black dark:text-white"
          : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
      }`}
    >
      <span>{label}</span>
      {badge && (
        <span className="rounded-full bg-zinc-200/70 px-2 py-0.5 text-[10px] font-normal text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {badge}
        </span>
      )}
      {active && (
        <span
          aria-hidden
          className="absolute inset-x-2 -bottom-px h-px bg-black dark:bg-white"
        />
      )}
    </Link>
  );
}

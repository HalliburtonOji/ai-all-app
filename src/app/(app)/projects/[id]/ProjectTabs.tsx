import Link from "next/link";

export type ProjectTab = "coach" | "memory" | "studio" | "docs";

interface ProjectTabsProps {
  projectId: string;
  currentTab: ProjectTab;
  factCount: number;
  outputCount: number;
  documentCount: number;
  currentConversationId: string | null;
}

export function ProjectTabs({
  projectId,
  currentTab,
  factCount,
  outputCount,
  documentCount,
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

  const docsParams = new URLSearchParams();
  docsParams.set("tab", "docs");
  if (currentConversationId) {
    docsParams.set("conversation", currentConversationId);
  }
  const docsUrl = `/projects/${projectId}?${docsParams.toString()}`;

  return (
    <nav
      aria-label="Project view"
      className="flex items-center gap-1 border-b border-[var(--border-soft)]"
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
          outputCount > 0
            ? `${outputCount} ${outputCount === 1 ? "output" : "outputs"}`
            : undefined
        }
      />
      <TabLink
        href={docsUrl}
        active={currentTab === "docs"}
        label="Docs"
        badge={
          documentCount > 0
            ? `${documentCount} ${documentCount === 1 ? "doc" : "docs"}`
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
          ? "text-[var(--brand-strong)]"
          : "text-zinc-500 hover:text-[var(--foreground)]"
      }`}
    >
      <span>{label}</span>
      {badge && (
        <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-normal text-zinc-600 dark:text-zinc-400">
          {badge}
        </span>
      )}
      {active && (
        <span
          aria-hidden
          className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--brand)]"
        />
      )}
    </Link>
  );
}

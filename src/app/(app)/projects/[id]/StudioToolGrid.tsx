import Link from "next/link";

interface ToolCounts {
  image: number;
  text: number;
  voice: number;
}

interface StudioToolGridProps {
  projectId: string;
  counts: ToolCounts;
}

interface ToolDef {
  id: "image" | "text" | "voice";
  title: string;
  tagline: string;
  icon: string;
  badge: number;
}

/**
 * The Studio tab's landing view: a 3-card grid of available tools.
 * Each card links to the per-tool panel via `?tab=studio&studio=…`.
 * Adding a new tool means adding a card here + a panel + the
 * studio_outputs row.
 */
export function StudioToolGrid({ projectId, counts }: StudioToolGridProps) {
  const tools: ToolDef[] = [
    {
      id: "image",
      title: "Image generator",
      tagline: "1024×1024 illustrations, mood boards, thumbnails.",
      icon: "🖼️",
      badge: counts.image,
    },
    {
      id: "text",
      title: "Copy / email drafter",
      tagline: "Short emails, social posts, captions, headlines.",
      icon: "✍️",
      badge: counts.text,
    },
    {
      id: "voice",
      title: "Voice-over",
      tagline: "≤30s narration. Pick a voice, hit go.",
      icon: "🎙️",
      badge: counts.voice,
    },
  ];

  return (
    <section
      data-studio-tool-grid="true"
      className="mt-4 space-y-6"
    >
      <div>
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Studio
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Tools attached to this project. Outputs are saved here and
          visible only to you.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((t) => (
          <li key={t.id}>
            <Link
              href={`/projects/${projectId}?tab=studio&studio=${t.id}`}
              data-studio-tool-card={t.id}
              className="block rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-2xl" aria-hidden>
                  {t.icon}
                </span>
                {t.badge > 0 && (
                  <span className="rounded-full bg-zinc-200/70 px-2 py-0.5 text-[10px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {t.badge}
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm font-semibold text-black dark:text-white">
                {t.title}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {t.tagline}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

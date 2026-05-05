import Link from "next/link";
import type { StudioOutput } from "@/types/studio";
import { StudioGenerateForm } from "./StudioGenerateForm";
import { StudioOutputGallery } from "./StudioOutputGallery";

interface StudioImagePanelProps {
  projectId: string;
  outputs: StudioOutput[];
  prefill?: string | null;
}

export function StudioImagePanel({
  projectId,
  outputs,
  prefill,
}: StudioImagePanelProps) {
  return (
    <section
      data-studio-panel="image"
      className="mt-4 space-y-6"
    >
      <BackToToolGrid projectId={projectId} />
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--brand-strong)] shadow-sm">
          <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--studio-accent)]" />
          Studio · Image
        </div>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
          Image generator
        </h2>
        <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
          Generate 1024×1024 images for this project. Each generation uses what
          the coach remembers.
        </p>
      </div>
      <StudioGenerateForm projectId={projectId} prefill={prefill} />
      <StudioOutputGallery
        projectId={projectId}
        outputs={outputs}
        kind="image"
      />
    </section>
  );
}

function BackToToolGrid({ projectId }: { projectId: string }) {
  return (
    <Link
      href={`/projects/${projectId}?tab=studio`}
      className="text-xs text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
    >
      ← All Studio tools
    </Link>
  );
}

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
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Image generator
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
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

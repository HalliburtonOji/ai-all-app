import type { StudioImage } from "@/types/studio";
import { StudioGenerateForm } from "./StudioGenerateForm";
import { StudioImageGrid } from "./StudioImageGrid";

interface StudioProps {
  projectId: string;
  images: StudioImage[];
}

export function Studio({ projectId, images }: StudioProps) {
  return (
    <section
      data-studio-panel="true"
      className="mt-4 space-y-6"
    >
      <div>
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Studio
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Generate images for this project. They&apos;re saved here and visible
          only to you.
        </p>
      </div>
      <StudioGenerateForm projectId={projectId} />
      <StudioImageGrid projectId={projectId} images={images} />
    </section>
  );
}

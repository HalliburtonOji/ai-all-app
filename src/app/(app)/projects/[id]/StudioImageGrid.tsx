"use client";

import { useTransition } from "react";
import Image from "next/image";
import type { StudioImage } from "@/types/studio";
import { deleteImage } from "./studio-actions";

interface StudioImageGridProps {
  projectId: string;
  images: StudioImage[];
}

export function StudioImageGrid({ projectId, images }: StudioImageGridProps) {
  if (images.length === 0) {
    return (
      <div
        className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-950"
        data-studio-empty-state="true"
      >
        <p className="mx-auto max-w-md text-sm text-zinc-600 dark:text-zinc-400">
          No images yet. Describe something above and the model will draw it.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {images.map((img, index) => (
        <StudioImageTile
          key={img.id}
          image={img}
          index={index}
          projectId={projectId}
        />
      ))}
    </ul>
  );
}

function StudioImageTile({
  image,
  index,
  projectId,
}: {
  image: StudioImage;
  index: number;
  projectId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(formData: FormData) {
    startTransition(async () => {
      await deleteImage(formData);
    });
  }

  return (
    <li
      data-studio-image-id={image.id}
      data-studio-image-index={index}
      className="group overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-900">
        <Image
          src={image.signed_url}
          alt={image.prompt}
          fill
          unoptimized
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="flex items-start justify-between gap-2 p-3">
        <p
          className="line-clamp-2 flex-1 text-xs text-zinc-700 dark:text-zinc-300"
          title={image.prompt}
        >
          {image.prompt}
        </p>
        <form action={handleDelete}>
          <input type="hidden" name="id" value={image.id} />
          <input type="hidden" name="project_id" value={projectId} />
          <button
            type="submit"
            disabled={isPending}
            aria-label="Delete image"
            className="rounded px-2 py-0.5 text-xs text-zinc-500 opacity-100 transition-opacity hover:bg-black/10 hover:text-red-600 disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100 dark:hover:bg-white/10 dark:hover:text-red-400"
          >
            Delete
          </button>
        </form>
      </div>
    </li>
  );
}

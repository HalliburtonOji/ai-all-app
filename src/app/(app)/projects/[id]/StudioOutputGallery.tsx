"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import type { StudioOutput, StudioOutputKind } from "@/types/studio";
import { deleteOutput, togglePublicOutput } from "./studio-actions";

interface StudioOutputGalleryProps {
  projectId: string;
  outputs: StudioOutput[];
  kind: StudioOutputKind;
  emptyState?: string;
}

const DEFAULT_EMPTY: Record<StudioOutputKind, string> = {
  image: "No images yet. Describe something above and the model will draw it.",
  text: "No drafts yet. Tell the model what to write above.",
  audio: "No voice-overs yet. Type a script above and pick a voice.",
};

/**
 * Shared gallery component used by all three per-tool panels. Renders
 * a kind-specific tile (image preview, text card, audio player) and
 * shares the delete affordance, hover behavior, empty state, and
 * data-* attributes.
 */
export function StudioOutputGallery({
  projectId,
  outputs,
  kind,
  emptyState,
}: StudioOutputGalleryProps) {
  if (outputs.length === 0) {
    return (
      <div
        className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-950"
        data-studio-empty-state={kind}
      >
        <p className="mx-auto max-w-md text-sm text-zinc-600 dark:text-zinc-400">
          {emptyState ?? DEFAULT_EMPTY[kind]}
        </p>
      </div>
    );
  }

  return (
    <ul
      className={
        kind === "text"
          ? "space-y-3"
          : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      }
    >
      {outputs.map((o, index) => (
        <StudioOutputTile
          key={o.id}
          output={o}
          index={index}
          projectId={projectId}
        />
      ))}
    </ul>
  );
}

function StudioOutputTile({
  output,
  index,
  projectId,
}: {
  output: StudioOutput;
  index: number;
  projectId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [isToggling, startToggleTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const isPublic = output.is_public === true;

  function handleDelete(formData: FormData) {
    startTransition(async () => {
      await deleteOutput(formData);
    });
  }

  function handleTogglePublic(formData: FormData) {
    startToggleTransition(async () => {
      await togglePublicOutput(formData);
    });
  }

  const tileClass =
    "group overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950";
  const commonAttributes = {
    "data-studio-output-id": output.id,
    "data-studio-output-kind": output.kind,
    "data-studio-output-index": index,
    "data-studio-output-model": output.model,
    "data-studio-output-public": isPublic ? "true" : "false",
  };

  if (output.kind === "image" && output.signed_url) {
    return (
      <li className={tileClass} {...commonAttributes}>
        <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-900">
          <Image
            src={output.signed_url}
            alt={output.prompt}
            fill
            unoptimized
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <TileFooter
          caption={output.prompt}
          outputId={output.id}
          projectId={projectId}
          isPending={isPending}
          onDelete={handleDelete}
          isPublic={isPublic}
          isToggling={isToggling}
          onTogglePublic={handleTogglePublic}
        />
      </li>
    );
  }

  if (output.kind === "text" && output.content_text) {
    const text = output.content_text;
    const isLong = text.length > 240;
    const display = expanded || !isLong ? text : text.slice(0, 240).trimEnd() + "…";
    return (
      <li
        className={`${tileClass} p-4`}
        {...commonAttributes}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {(output.metadata?.kind_hint as string) ?? "general"} draft
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-black dark:text-white">
          {display}
        </p>
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 text-xs text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}
        <p className="mt-3 text-xs italic text-zinc-500 dark:text-zinc-400">
          Prompt: {output.prompt}
        </p>
        <TileFooter
          outputId={output.id}
          projectId={projectId}
          isPending={isPending}
          onDelete={handleDelete}
          isPublic={isPublic}
          isToggling={isToggling}
          onTogglePublic={handleTogglePublic}
        />
      </li>
    );
  }

  if (output.kind === "audio" && output.signed_url) {
    return (
      <li className={`${tileClass} p-4`} {...commonAttributes}>
        <audio
          controls
          preload="metadata"
          src={output.signed_url}
          className="w-full"
        />
        {output.content_text && (
          <p className="mt-2 line-clamp-3 text-xs italic text-zinc-700 dark:text-zinc-300">
            &ldquo;{output.content_text}&rdquo;
          </p>
        )}
        <TileFooter
          outputId={output.id}
          projectId={projectId}
          isPending={isPending}
          onDelete={handleDelete}
          isPublic={isPublic}
          isToggling={isToggling}
          onTogglePublic={handleTogglePublic}
        />
      </li>
    );
  }

  // Fallback: kind/data mismatch — render a tiny diagnostic so it's
  // visible in the UI rather than silently swallowed.
  return (
    <li className={`${tileClass} p-3`} {...commonAttributes}>
      <p className="text-xs italic text-zinc-500">
        Output unavailable ({output.kind}).
      </p>
    </li>
  );
}

function TileFooter({
  caption,
  outputId,
  projectId,
  isPending,
  onDelete,
  isPublic,
  isToggling,
  onTogglePublic,
}: {
  caption?: string;
  outputId: string;
  projectId: string;
  isPending: boolean;
  onDelete: (formData: FormData) => void;
  isPublic: boolean;
  isToggling: boolean;
  onTogglePublic: (formData: FormData) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-2 p-3 pt-2">
      {caption ? (
        <p
          className="line-clamp-2 flex-1 text-xs text-zinc-700 dark:text-zinc-300"
          title={caption}
        >
          {caption}
        </p>
      ) : (
        <span aria-hidden className="flex-1" />
      )}
      <div className="flex flex-shrink-0 items-center gap-1">
        <form action={onTogglePublic}>
          <input type="hidden" name="id" value={outputId} />
          <input type="hidden" name="project_id" value={projectId} />
          <input
            type="hidden"
            name="currently_public"
            value={isPublic ? "true" : "false"}
          />
          <button
            type="submit"
            disabled={isToggling}
            aria-label={isPublic ? "Make output private" : "Add output to portfolio"}
            data-public-toggle="true"
            data-currently-public={isPublic ? "true" : "false"}
            className={
              isPublic
                ? "rounded px-2 py-0.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                : "rounded px-2 py-0.5 text-xs text-zinc-600 transition-opacity hover:bg-black/10 hover:text-emerald-700 disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-emerald-400"
            }
          >
            {isPublic ? "Public" : "Add to portfolio"}
          </button>
        </form>
        <form action={onDelete}>
          <input type="hidden" name="id" value={outputId} />
          <input type="hidden" name="project_id" value={projectId} />
          <button
            type="submit"
            disabled={isPending}
            aria-label="Delete output"
            className="rounded px-2 py-0.5 text-xs text-zinc-600 opacity-100 transition-opacity hover:bg-black/10 hover:text-red-600 disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-red-400"
          >
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}

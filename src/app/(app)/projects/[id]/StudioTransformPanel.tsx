"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { StudioOutput } from "@/types/studio";
import { transformUploadedImage } from "./studio-actions";
import { StudioOutputGallery } from "./StudioOutputGallery";
import { createClient as createBrowserSupabase } from "@/utils/supabase/client";

interface StudioTransformPanelProps {
  projectId: string;
  outputs: StudioOutput[];
}

const MAX_BYTES = 12 * 1024 * 1024;
const ACCEPT = "image/png,image/jpeg,image/webp";
const BUCKET = "studio-images";

const TRANSFORM_OPTIONS: Array<{
  value: "upscale" | "remove_bg";
  label: string;
  blurb: string;
}> = [
  {
    value: "upscale",
    label: "Upscale 4×",
    blurb: "Real-ESRGAN. Sharper output, ~4× the resolution. Good for photos and renders.",
  },
  {
    value: "remove_bg",
    label: "Remove background",
    blurb: "rembg. Clean alpha cutout. Works best on subjects with clear edges.",
  },
];

export function StudioTransformPanel({
  projectId,
  outputs,
}: StudioTransformPanelProps) {
  const [transform, setTransform] = useState<"upscale" | "remove_bg">("upscale");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Filter the gallery to only outputs whose metadata.source==="transform".
  const transforms = outputs.filter((o) => {
    if (o.kind !== "image") return false;
    const meta = o.metadata as Record<string, unknown> | null;
    return meta?.source === "transform";
  });

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (file.size > MAX_BYTES) {
      setError("Image exceeds 12 MB limit.");
      e.target.value = "";
      return;
    }
    setProgress("Uploading…");

    const supabase = createBrowserSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not signed in.");
      setProgress(null);
      return;
    }

    const ext = (file.name.split(".").pop() ?? "img").toLowerCase();
    const safeExt = ext.replace(/[^a-z0-9]/g, "").slice(0, 6) || "img";
    const stamp = Date.now();
    const sourcePath = `${user.id}/${projectId}/transform-source-${stamp}.${safeExt}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(sourcePath, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
    if (upErr) {
      setError(`Upload failed: ${upErr.message}`);
      setProgress(null);
      return;
    }

    setProgress(
      transform === "upscale" ? "Upscaling…" : "Removing background…",
    );
    const formData = new FormData();
    formData.set("project_id", projectId);
    formData.set("source_path", sourcePath);
    formData.set("original_filename", file.name);
    formData.set("transform", transform);

    startTransition(async () => {
      const result = await transformUploadedImage(formData);
      setProgress(null);
      if (fileRef.current) fileRef.current.value = "";
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section data-studio-panel="transform" className="mt-4 space-y-6">
      <Link
        href={`/projects/${projectId}?tab=studio`}
        className="text-xs text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
      >
        ← All Studio tools
      </Link>
      <div>
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Transform image
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Run an image-to-image transform on something you already have. Pick
          the operation, drop the file. Source is discarded after processing.
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-[var(--border-soft)] bg-[var(--surface)] p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {TRANSFORM_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTransform(opt.value)}
              data-transform-option={opt.value}
              data-transform-active={transform === opt.value ? "true" : "false"}
              className={
                "flex flex-col items-start rounded-md border p-3 text-left transition-colors " +
                (transform === opt.value
                  ? "border-[var(--brand)] bg-[var(--brand-soft)]/40"
                  : "border-[var(--border-soft)] bg-transparent hover:bg-[var(--surface-muted)]")
              }
            >
              <span className="text-sm font-semibold text-[var(--foreground)]">
                {opt.label}
              </span>
              <span className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                {opt.blurb}
              </span>
            </button>
          ))}
        </div>

        <label className="mt-5 flex cursor-pointer flex-col items-start gap-2 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Image file
          </span>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            disabled={isPending || progress !== null}
            onChange={onPick}
            data-transform-input="true"
            className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-[var(--brand)] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white file:transition-colors hover:file:bg-[var(--brand-strong)] disabled:opacity-50 dark:text-zinc-300"
          />
        </label>

        {progress && (
          <p
            data-transform-progress="true"
            className="mt-3 text-xs text-zinc-600 dark:text-zinc-400"
          >
            {progress}
          </p>
        )}
        {error && (
          <p
            role="alert"
            data-transform-error="true"
            className="mt-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
          >
            {error}
          </p>
        )}
      </div>

      <StudioOutputGallery
        projectId={projectId}
        outputs={transforms}
        kind="image"
      />
    </section>
  );
}

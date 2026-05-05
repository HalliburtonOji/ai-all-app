"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { StudioOutput } from "@/types/studio";
import { transcribeUploadedAudio } from "./studio-actions";
import { StudioOutputGallery } from "./StudioOutputGallery";
import { createClient as createBrowserSupabase } from "@/utils/supabase/client";

interface StudioTranscribePanelProps {
  projectId: string;
  outputs: StudioOutput[];
}

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const ACCEPT = "audio/*,.m4a,.mp3,.wav,.webm,.ogg,.mp4";
const BUCKET = "studio-images";

export function StudioTranscribePanel({
  projectId,
  outputs,
}: StudioTranscribePanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Filter the gallery to only the transcripts (text outputs whose
  // metadata.source === "transcription"). Non-transcribed text drafts
  // belong on the text panel; this panel is the voice→text view.
  const transcripts = outputs.filter((o) => {
    if (o.kind !== "text") return false;
    const meta = o.metadata as Record<string, unknown> | null;
    return meta?.source === "transcription";
  });

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (file.size > MAX_AUDIO_BYTES) {
      setError("File exceeds 25 MB limit (Whisper cap).");
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

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "audio";
    const safeExt = ext.replace(/[^a-z0-9]/g, "").slice(0, 6) || "audio";
    const stamp = Date.now();
    const audioPath = `${user.id}/${projectId}/transcribe-${stamp}.${safeExt}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(audioPath, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
    if (upErr) {
      setError(`Upload failed: ${upErr.message}`);
      setProgress(null);
      return;
    }

    setProgress("Transcribing…");
    const formData = new FormData();
    formData.set("project_id", projectId);
    formData.set("audio_path", audioPath);
    formData.set("original_filename", file.name);

    startTransition(async () => {
      const result = await transcribeUploadedAudio(formData);
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
    <section data-studio-panel="transcribe" className="mt-4 space-y-6">
      <Link
        href={`/projects/${projectId}?tab=studio`}
        className="text-xs text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
      >
        ← All Studio tools
      </Link>
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--brand-strong)] shadow-sm">
          <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--studio-accent)]" />
          Studio · Transcribe
        </div>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
          Transcribe audio
        </h2>
        <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
          Drop a voice memo, podcast clip, or interview. We send it to Whisper
          and save the transcript here. Files up to 25 MB. Source audio is
          discarded after transcription.
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-[var(--border-soft)] bg-[var(--surface)] p-6">
        <label className="flex cursor-pointer flex-col items-start gap-2 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Audio file
          </span>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            disabled={isPending || progress !== null}
            onChange={onPick}
            data-transcribe-input="true"
            className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-[var(--brand)] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white file:transition-colors hover:file:bg-[var(--brand-strong)] disabled:opacity-50 dark:text-zinc-300"
          />
        </label>
        {progress && (
          <p
            data-transcribe-progress="true"
            className="mt-3 text-xs text-zinc-600 dark:text-zinc-400"
          >
            {progress}
          </p>
        )}
        {error && (
          <p
            role="alert"
            data-transcribe-error="true"
            className="mt-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
          >
            {error}
          </p>
        )}
      </div>

      <StudioOutputGallery
        projectId={projectId}
        outputs={transcripts}
        kind="text"
      />
    </section>
  );
}

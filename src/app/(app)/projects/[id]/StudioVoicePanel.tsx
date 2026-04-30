"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { StudioOutput } from "@/types/studio";
import { generateVoiceOver } from "./studio-actions";
import { StudioOutputGallery } from "./StudioOutputGallery";
import { VOICE_PRESETS, DEFAULT_VOICE_ID } from "@/lib/studio/generate-voice";

interface StudioVoicePanelProps {
  projectId: string;
  outputs: StudioOutput[];
  prefill?: string | null;
}

const MAX_SCRIPT = 500;

export function StudioVoicePanel({
  projectId,
  outputs,
  prefill,
}: StudioVoicePanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [script, setScript] = useState<string>(prefill ?? "");
  const [voiceId, setVoiceId] = useState<string>(DEFAULT_VOICE_ID);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (prefill && textareaRef.current) {
      textareaRef.current.focus();
      const url = new URL(window.location.href);
      if (url.searchParams.has("prefill")) {
        url.searchParams.delete("prefill");
        router.replace(url.pathname + url.search);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await generateVoiceOver(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
      setScript("");
      router.refresh();
    });
  }

  const charsLeft = MAX_SCRIPT - script.length;
  const overCap = charsLeft < 0;

  return (
    <section data-studio-panel="voice" className="mt-4 space-y-6">
      <Link
        href={`/projects/${projectId}?tab=studio`}
        className="text-xs text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
      >
        ← All Studio tools
      </Link>
      <div>
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Voice-over
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Type a short script, pick a voice, get an audio clip up to ~30
          seconds.
        </p>
      </div>

      <form
        ref={formRef}
        action={handleSubmit}
        className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
        data-studio-form="voice"
      >
        <input type="hidden" name="project_id" value={projectId} />
        <label
          htmlFor="studio-voice-script"
          className="block text-sm font-medium text-black dark:text-white"
        >
          Script
        </label>
        <textarea
          id="studio-voice-script"
          ref={textareaRef}
          name="script"
          rows={3}
          required
          minLength={1}
          maxLength={MAX_SCRIPT}
          disabled={isPending}
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="Welcome back to the channel — today we're cooking with peppers."
          aria-label="Voice-over script"
          className="mt-2 w-full resize-none rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-white"
        />
        <p
          className={`mt-1 text-xs ${
            overCap
              ? "text-red-600 dark:text-red-400"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
          data-studio-voice-charcount
        >
          {script.length} / {MAX_SCRIPT} characters
        </p>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs">
            <label
              htmlFor="studio-voice-id"
              className="text-zinc-500 dark:text-zinc-400"
            >
              Voice
            </label>
            <select
              id="studio-voice-id"
              name="voice_id"
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              disabled={isPending}
              aria-label="Voice"
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-black disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            >
              {VOICE_PRESETS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={isPending || overCap || script.trim().length === 0}
            data-studio-generate-button="voice"
            className="shrink-0 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {isPending ? "Generating…" : "Generate voice-over"}
          </button>
        </div>
        {error && (
          <p
            role="alert"
            data-studio-error="voice"
            className="mt-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
          >
            {error}
          </p>
        )}
      </form>

      <StudioOutputGallery
        projectId={projectId}
        outputs={outputs}
        kind="audio"
      />
    </section>
  );
}

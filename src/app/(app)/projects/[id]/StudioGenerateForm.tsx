"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateImage } from "./studio-actions";

interface StudioGenerateFormProps {
  projectId: string;
}

export function StudioGenerateForm({ projectId }: StudioGenerateFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await generateImage(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
      // The server action revalidates the page, but a router refresh
      // ensures the new tile renders without the user clicking around.
      router.refresh();
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
      data-studio-form="true"
    >
      <input type="hidden" name="project_id" value={projectId} />
      <label
        htmlFor="studio-prompt"
        className="block text-sm font-medium text-black dark:text-white"
      >
        Describe what you want to create
      </label>
      <textarea
        id="studio-prompt"
        name="prompt"
        rows={3}
        required
        minLength={1}
        maxLength={1000}
        disabled={isPending}
        placeholder="A neon-lit street market in Lagos at dusk, photorealistic"
        aria-label="Image prompt"
        className="mt-2 w-full resize-none rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-white"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {isPending
            ? "Generating image…"
            : "Square 1024×1024. Generation usually takes a few seconds."}
        </p>
        <button
          type="submit"
          disabled={isPending}
          data-studio-generate-button="true"
          className="shrink-0 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {isPending ? "Generating…" : "Generate image"}
        </button>
      </div>
      {error && (
        <p
          role="alert"
          data-studio-error="true"
          className="mt-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
        >
          {error}
        </p>
      )}
    </form>
  );
}

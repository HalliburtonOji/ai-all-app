"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateImage } from "./studio-actions";

interface StudioGenerateFormProps {
  projectId: string;
  prefill?: string | null;
}

export function StudioGenerateForm({
  projectId,
  prefill,
}: StudioGenerateFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>(prefill ?? "");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // Consume the URL prefill once, then strip it so reloads don't re-fill.
  useEffect(() => {
    if (prefill && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      const url = new URL(window.location.href);
      if (url.searchParams.has("prefill")) {
        url.searchParams.delete("prefill");
        router.replace(url.pathname + url.search);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleRefineWithCoach() {
    const value = textareaRef.current?.value ?? prompt;
    if (!value.trim()) return;
    const params = new URLSearchParams();
    params.set("prefill", value);
    router.push(`/projects/${projectId}?${params.toString()}`);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await generateImage(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
      setPrompt("");
      // The server action revalidates the page, but a router refresh
      // ensures the new tile renders without the user clicking around.
      router.refresh();
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-5"
      data-studio-form="true"
    >
      <input type="hidden" name="project_id" value={projectId} />
      <label
        htmlFor="studio-prompt"
        className="block text-sm font-medium text-[var(--foreground)]"
      >
        Describe what you want to create
      </label>
      <textarea
        id="studio-prompt"
        ref={textareaRef}
        name="prompt"
        rows={3}
        required
        minLength={1}
        maxLength={1000}
        disabled={isPending}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="A neon-lit street market in Lagos at dusk, photorealistic"
        aria-label="Image prompt"
        className="mt-2 w-full resize-none rounded-md border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)] disabled:opacity-50"
      />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {isPending
            ? "Generating image…"
            : "Square 1024×1024. Generation uses what the coach remembers about this project."}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefineWithCoach}
            disabled={isPending || !prompt.trim()}
            data-studio-refine-button="true"
            className="shrink-0 rounded-md border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-muted)] disabled:opacity-50"
          >
            Refine with coach
          </button>
          <button
            type="submit"
            disabled={isPending}
            data-studio-generate-button="true"
            className="shrink-0 rounded-md bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-[var(--brand-strong)] hover:shadow-md disabled:opacity-50"
          >
            {isPending ? "Generating…" : "Generate image"}
          </button>
        </div>
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

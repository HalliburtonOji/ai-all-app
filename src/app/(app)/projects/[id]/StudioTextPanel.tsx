"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { StudioOutput } from "@/types/studio";
import { generateTextDraft } from "./studio-actions";
import { StudioOutputGallery } from "./StudioOutputGallery";
import { createChainFromRecentTextOutputs } from "./workflows/actions";

interface StudioTextPanelProps {
  projectId: string;
  outputs: StudioOutput[];
  prefill?: string | null;
}

const KIND_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "general", label: "General" },
  { value: "email", label: "Email" },
  { value: "social_post", label: "Social post" },
  { value: "caption", label: "Caption" },
  { value: "code", label: "Code" },
  { value: "long_form", label: "Long-form (blog/article)" },
];

export function StudioTextPanel({
  projectId,
  outputs,
  prefill,
}: StudioTextPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>(prefill ?? "");
  const [kind, setKind] = useState<string>("general");
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
      const result = await generateTextDraft(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
      setPrompt("");
      router.refresh();
    });
  }

  function handleRefineWithCoach() {
    const value = textareaRef.current?.value ?? prompt;
    if (!value.trim()) return;
    const params = new URLSearchParams();
    params.set("prefill", value);
    router.push(`/projects/${projectId}?${params.toString()}`);
  }

  return (
    <section data-studio-panel="text" className="mt-4 space-y-6">
      <Link
        href={`/projects/${projectId}?tab=studio`}
        className="text-xs text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
      >
        ← All Studio tools
      </Link>
      <div>
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Copy / email drafter
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Short emails, social posts, captions, headlines — drafted from your
          intent + what the coach remembers.
        </p>
      </div>

      <form
        ref={formRef}
        action={handleSubmit}
        className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
        data-studio-form="text"
      >
        <input type="hidden" name="project_id" value={projectId} />
        <label
          htmlFor="studio-text-prompt"
          className="block text-sm font-medium text-black dark:text-white"
        >
          What do you want me to write?
        </label>
        <textarea
          id="studio-text-prompt"
          ref={textareaRef}
          name="prompt"
          rows={3}
          required
          minLength={1}
          maxLength={2000}
          disabled={isPending}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Draft a short LinkedIn post about our launch — friendly tone, ~250 chars."
          aria-label="Text draft prompt"
          className="mt-2 w-full resize-none rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-white"
        />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs">
            <label
              htmlFor="studio-text-kind"
              className="text-zinc-500 dark:text-zinc-400"
            >
              Type
            </label>
            <select
              id="studio-text-kind"
              name="kind_hint"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              disabled={isPending}
              aria-label="Draft type"
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-black disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            >
              {KIND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefineWithCoach}
              disabled={isPending || !prompt.trim()}
              data-studio-refine-button="true"
              className="shrink-0 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
            >
              Refine with coach
            </button>
            <button
              type="submit"
              disabled={isPending}
              data-studio-generate-button="text"
              className="shrink-0 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {isPending ? "Drafting…" : "Draft it"}
            </button>
          </div>
        </div>
        {error && (
          <p
            role="alert"
            data-studio-error="text"
            className="mt-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
          >
            {error}
          </p>
        )}
      </form>

      <StudioOutputGallery
        projectId={projectId}
        outputs={outputs}
        kind="text"
      />

      {outputs.length >= 2 && (
        <RecorderControls projectId={projectId} maxCount={Math.min(outputs.length, 5)} />
      )}
    </section>
  );
}

function RecorderControls({
  projectId,
  maxCount,
}: {
  projectId: string;
  maxCount: number;
}) {
  const router = useRouter();
  const [count, setCount] = useState<number>(Math.min(2, maxCount));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedChainId, setSavedChainId] = useState<string | null>(null);

  function onSave() {
    setError(null);
    setSavedChainId(null);
    const formData = new FormData();
    formData.set("project_id", projectId);
    formData.set("count", String(count));
    startTransition(async () => {
      const result = await createChainFromRecentTextOutputs(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSavedChainId(result.chainId ?? null);
      router.refresh();
    });
  }

  return (
    <aside
      data-recorder-panel="true"
      className="rounded-lg border border-dashed border-[var(--border-soft)] bg-[var(--surface)] p-4"
    >
      <div className="flex flex-wrap items-baseline gap-2">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">
          Save these as a recipe
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Turn your last few text generations into a re-runnable workflow.
        </p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="text-xs text-zinc-600 dark:text-zinc-400">
          How many?
          <select
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value, 10))}
            disabled={isPending}
            data-recorder-count="true"
            className="ml-2 rounded-md border border-[var(--border-soft)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--foreground)] disabled:opacity-50"
          >
            {Array.from({ length: maxCount - 1 }, (_, i) => i + 2).map((n) => (
              <option key={n} value={n}>
                Last {n}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={onSave}
          disabled={isPending}
          data-recorder-save="true"
          className="rounded-md bg-[var(--brand)] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-[var(--brand-strong)] disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save as workflow"}
        </button>
        {savedChainId && (
          <Link
            href={`/projects/${projectId}?tab=studio&studio=workflows`}
            data-recorder-saved-link="true"
            className="text-xs font-medium text-[var(--brand-strong)] underline-offset-2 hover:underline"
          >
            View in Workflows →
          </Link>
        )}
      </div>
      {error && (
        <p
          role="alert"
          data-recorder-error="true"
          className="mt-2 text-xs text-red-700 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </aside>
  );
}

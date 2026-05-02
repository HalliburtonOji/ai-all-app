"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { StudioOutput } from "@/types/studio";
import { generateTextDraft } from "./studio-actions";
import { StudioOutputGallery } from "./StudioOutputGallery";

interface StudioEmailPanelProps {
  projectId: string;
  outputs: StudioOutput[];
}

const MAX_THREAD_CHARS = 12_000;
const MAX_INTENT_CHARS = 1_000;

/**
 * Email reply drafter — fourth Studio tool. Two inputs (thread +
 * intent) instead of overloading the single-prompt text panel.
 * Generates a reply that matches the thread's tone, without filler.
 *
 * Stored as a kind="text" studio_output with metadata.kind_hint =
 * "email_reply", so it shares the gallery + RLS + delete flow with
 * the rest of the text drafter outputs (filtered here to email-reply
 * only via metadata).
 */
export function StudioEmailPanel({
  projectId,
  outputs,
}: StudioEmailPanelProps) {
  const [thread, setThread] = useState("");
  const [intent, setIntent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  // Filter to just email-reply outputs so this panel's gallery shows
  // *only* the user's previously drafted replies.
  const emailReplyOutputs = outputs.filter(
    (o) => (o.metadata?.kind_hint as string) === "email_reply",
  );

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await generateTextDraft(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
      setThread("");
      setIntent("");
      router.refresh();
    });
  }

  const threadOver = thread.length > MAX_THREAD_CHARS;
  const intentOver = intent.length > MAX_INTENT_CHARS;
  const submittable =
    !isPending &&
    thread.trim().length > 0 &&
    intent.trim().length > 0 &&
    !threadOver &&
    !intentOver;

  return (
    <section data-studio-panel="email-reply" className="mt-4 space-y-6">
      <Link
        href={`/projects/${projectId}?tab=studio`}
        className="text-xs text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
      >
        ← All Studio tools
      </Link>
      <div>
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Email reply drafter
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Paste the thread, say what you want to communicate, get a reply
          that matches the existing tone.
        </p>
      </div>

      <form
        ref={formRef}
        action={onSubmit}
        data-studio-form="email-reply"
        className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <input type="hidden" name="project_id" value={projectId} />
        <input type="hidden" name="kind_hint" value="email_reply" />

        <label className="block">
          <span className="block text-sm font-medium text-black dark:text-white">
            The thread <span className="text-red-700">*</span>
          </span>
          <textarea
            name="extra_context"
            value={thread}
            onChange={(e) => setThread(e.target.value)}
            rows={8}
            required
            disabled={isPending}
            placeholder="Paste the most-recent email + any prior replies you want me to read."
            data-studio-email-thread="true"
            aria-label="Email thread"
            className="mt-1 block w-full resize-y rounded-md border border-[var(--border-soft)] bg-white px-3 py-2 font-mono text-xs text-[var(--foreground)] placeholder:text-zinc-400 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)] disabled:opacity-50 dark:bg-zinc-900"
          />
          <p
            className={
              threadOver
                ? "mt-1 text-xs text-red-700 dark:text-red-400"
                : "mt-1 text-xs text-zinc-500"
            }
          >
            {thread.length.toLocaleString()} / {MAX_THREAD_CHARS.toLocaleString()} chars
          </p>
        </label>

        <label className="mt-4 block">
          <span className="block text-sm font-medium text-black dark:text-white">
            What do you want to say back? <span className="text-red-700">*</span>
          </span>
          <textarea
            name="prompt"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            rows={3}
            required
            disabled={isPending}
            placeholder="e.g. Thank them, accept the meeting on Tuesday, and ask if 3pm works."
            data-studio-email-intent="true"
            aria-label="Email reply intent"
            className="mt-1 block w-full resize-none rounded-md border border-[var(--border-soft)] bg-white px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-zinc-400 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)] disabled:opacity-50 dark:bg-zinc-900"
          />
          <p
            className={
              intentOver
                ? "mt-1 text-xs text-red-700 dark:text-red-400"
                : "mt-1 text-xs text-zinc-500"
            }
          >
            {intent.length.toLocaleString()} / {MAX_INTENT_CHARS.toLocaleString()} chars
          </p>
        </label>

        <div className="mt-3 flex items-center justify-end">
          <button
            type="submit"
            disabled={!submittable}
            data-studio-generate-button="email-reply"
            className="shrink-0 rounded-md bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--brand-strong)] disabled:opacity-50"
          >
            {isPending ? "Drafting…" : "Draft reply"}
          </button>
        </div>

        {error && (
          <p
            role="alert"
            data-studio-error="email-reply"
            className="mt-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
          >
            {error}
          </p>
        )}
      </form>

      <StudioOutputGallery
        projectId={projectId}
        outputs={emailReplyOutputs}
        kind="text"
        emptyState="No email replies yet. Paste a thread above and the drafter will write one in matching tone."
      />
    </section>
  );
}

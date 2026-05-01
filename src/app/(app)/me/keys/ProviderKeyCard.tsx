"use client";

import { useState, useTransition } from "react";
import { saveUserApiKey, deleteUserApiKey } from "./actions";

interface ProviderInfo {
  id: string;
  label: string;
  blurb: string;
  signupUrl: string;
  signupLabel: string;
}

interface ProviderKeyCardProps {
  provider: ProviderInfo;
  /** Redacted display of the saved key, or null if none saved. */
  redacted: string | null;
  /** Optional friendly label the user gave the key when saving. */
  storedLabel: string | null;
}

export function ProviderKeyCard({
  provider,
  redacted,
  storedLabel,
}: ProviderKeyCardProps) {
  const [pasted, setPasted] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const hasKey = !!redacted;

  function onSubmit(formData: FormData) {
    setError(null);
    setSavedNotice(null);
    startTransition(async () => {
      const result = await saveUserApiKey(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSavedNotice("Saved. The app will use your key on the next request.");
      setPasted("");
      setLabel("");
    });
  }

  function onDelete(formData: FormData) {
    startTransition(async () => {
      await deleteUserApiKey(formData);
      setConfirmingDelete(false);
    });
  }

  return (
    <section
      data-byok-card={provider.id}
      data-byok-has-key={hasKey ? "true" : "false"}
      className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-black dark:text-white">
          {provider.label}
        </h2>
        {hasKey ? (
          <span
            data-byok-status="set"
            className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
          >
            Your key
          </span>
        ) : (
          <span
            data-byok-status="unset"
            className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            Using platform key
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {provider.blurb}{" "}
        <a
          href={provider.signupUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100"
        >
          {provider.signupLabel}
        </a>
      </p>

      {hasKey && (
        <div
          data-byok-redacted={provider.id}
          className="mt-3 rounded-md bg-zinc-100 px-3 py-2 font-mono text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        >
          {redacted}
          {storedLabel && (
            <span className="ml-2 not-italic text-zinc-500">· {storedLabel}</span>
          )}
        </div>
      )}

      <form action={onSubmit} className="mt-4 space-y-3">
        <input type="hidden" name="provider" value={provider.id} />
        <label className="block text-sm">
          <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            {hasKey ? "Replace your key" : "Paste your key"}
          </span>
          <input
            type="password"
            name="api_key"
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder="sk-…"
            data-byok-input={provider.id}
            className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-black placeholder:text-zinc-400 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
          />
        </label>
        <label className="block text-sm">
          <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Label (optional)
          </span>
          <input
            type="text"
            name="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={100}
            placeholder="e.g. Personal Anthropic"
            data-byok-label-input={provider.id}
            className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black placeholder:text-zinc-400 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
          />
        </label>

        {error && (
          <p
            role="alert"
            data-byok-error={provider.id}
            className="text-xs text-red-700 dark:text-red-400"
          >
            {error}
          </p>
        )}
        {savedNotice && (
          <p
            data-byok-saved={provider.id}
            className="text-xs text-emerald-800 dark:text-emerald-300"
          >
            {savedNotice}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="submit"
            disabled={isPending || pasted.trim().length === 0}
            data-byok-save={provider.id}
            className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {isPending ? "Saving…" : hasKey ? "Replace key" : "Save key"}
          </button>

          {hasKey && !confirmingDelete && (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              data-byok-delete={provider.id}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-red-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-red-400"
            >
              Delete key
            </button>
          )}
        </div>
      </form>

      {hasKey && confirmingDelete && (
        <form
          action={onDelete}
          className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800"
        >
          <input type="hidden" name="provider" value={provider.id} />
          <span className="text-xs text-zinc-700 dark:text-zinc-300">
            Delete this key?
          </span>
          <button
            type="submit"
            disabled={isPending}
            data-byok-confirm-delete={provider.id}
            className="rounded-md border border-red-300 bg-white px-2 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:bg-zinc-950 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            Yes, delete
          </button>
          <button
            type="button"
            onClick={() => setConfirmingDelete(false)}
            className="rounded-md px-2 py-1 text-xs text-zinc-700 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/5"
          >
            Cancel
          </button>
        </form>
      )}
    </section>
  );
}

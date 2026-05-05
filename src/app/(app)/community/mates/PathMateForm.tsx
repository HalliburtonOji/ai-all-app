"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  upsertPathMateSignal,
  deletePathMateSignal,
} from "./actions";
import {
  MAX_BIO_LENGTH,
  MAX_PATH_LENGTH,
  type PathMateSignal,
} from "@/types/mates";

export function PathMateForm({
  signal,
}: {
  signal: PathMateSignal | null;
}) {
  const router = useRouter();
  const [path, setPath] = useState(signal?.path ?? "");
  const [bio, setBio] = useState(signal?.bio ?? "");
  const [tagsRaw, setTagsRaw] = useState((signal?.tags ?? []).join(", "));
  const [isPublic, setIsPublic] = useState(signal?.is_public ?? false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await upsertPathMateSignal(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSavedAt(Date.now());
      router.refresh();
    });
  }

  function onDelete() {
    startTransition(async () => {
      await deletePathMateSignal();
      setPath("");
      setBio("");
      setTagsRaw("");
      setIsPublic(false);
      setConfirmingDelete(false);
      router.refresh();
    });
  }

  return (
    <form
      action={onSubmit}
      data-mate-form="true"
      className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-5"
    >
      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
        Your path
      </h2>
      <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
        One short line about what you&apos;re working on. Tag overlap is how
        people find you. Public is opt-in — toggle it off any time.
      </p>

      <label className="mt-5 block text-sm">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Path <span className="text-red-700">*</span>
        </span>
        <input
          name="path"
          type="text"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          maxLength={MAX_PATH_LENGTH}
          required
          placeholder="e.g. freelance designer building an AI-assisted practice"
          data-mate-path="true"
          className="mt-1 block w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)]"
        />
      </label>

      <label className="mt-3 block text-sm">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Tags
        </span>
        <input
          name="tags"
          type="text"
          value={tagsRaw}
          onChange={(e) => setTagsRaw(e.target.value)}
          placeholder="comma, separated, lowercase, max 8"
          data-mate-tags="true"
          className="mt-1 block w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)]"
        />
        <span className="mt-1 block text-xs text-zinc-500">
          e.g. design, freelance, africa, newsletter, indie-hacker
        </span>
      </label>

      <label className="mt-3 block text-sm">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Bio (optional)
        </span>
        <textarea
          name="bio"
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={MAX_BIO_LENGTH}
          placeholder="Two short sentences. What you make, what you're after."
          data-mate-bio="true"
          className="mt-1 block w-full resize-y rounded-md border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)]"
        />
      </label>

      <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_public"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          data-mate-public="true"
          className="h-4 w-4 rounded border-[var(--border-soft)] accent-[var(--brand)]"
        />
        <span className="text-zinc-700 dark:text-zinc-300">
          Show me on the public path-mate list
        </span>
      </label>

      {error && (
        <p
          role="alert"
          data-mate-error="true"
          className="mt-3 text-sm text-red-700 dark:text-red-400"
        >
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={isPending}
          data-mate-save="true"
          className="rounded-md bg-[var(--brand)] px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-[var(--brand-strong)] disabled:opacity-50"
        >
          {isPending ? "Saving…" : signal ? "Save changes" : "Publish signal"}
        </button>
        {savedAt && !error && (
          <span className="text-xs text-emerald-700 dark:text-emerald-400">
            Saved.
          </span>
        )}
        {signal && (
          <div className="ml-auto">
            {!confirmingDelete ? (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                data-mate-delete-button="true"
                className="rounded-md px-3 py-1.5 text-xs text-zinc-600 hover:bg-black/5 hover:text-red-700 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-red-400"
              >
                Remove my signal
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={isPending}
                  data-mate-confirm-delete="true"
                  className="rounded-md border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-black/5"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </form>
  );
}

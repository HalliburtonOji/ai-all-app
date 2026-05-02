"use client";

import { useRef, useState, useTransition } from "react";
import { uploadProjectDocument } from "./actions";

export function DocumentUploadForm({
  projectId,
  disabledReason,
}: {
  projectId: string;
  /** When non-null, the form shows this reason and disables the button. */
  disabledReason: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    setOkMessage(null);
    startTransition(async () => {
      const result = await uploadProjectDocument(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOkMessage(
        `Uploaded ${result.filename ?? "document"}. Ask the document below.`,
      );
      formRef.current?.reset();
    });
  }

  const isDisabled = !!disabledReason || isPending;

  return (
    <form
      ref={formRef}
      action={onSubmit}
      data-doc-upload-form="true"
      className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <input type="hidden" name="project_id" value={projectId} />
      <h3 className="text-sm font-semibold text-black dark:text-white">
        Upload a PDF
      </h3>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
        Up to 10 MB. Once uploaded you can ask the coach about it. Stays
        private to this project.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          type="file"
          name="file"
          accept="application/pdf"
          required
          disabled={isDisabled}
          data-doc-upload-input="true"
          className="block text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[var(--brand)] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white file:transition-colors hover:file:bg-[var(--brand-strong)] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isDisabled}
          data-doc-upload-button="true"
          className="rounded-md border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)] disabled:opacity-50"
        >
          {isPending ? "Uploading…" : "Upload"}
        </button>
      </div>

      {disabledReason && (
        <p
          data-doc-upload-disabled-reason="true"
          className="mt-2 text-xs text-zinc-500"
        >
          {disabledReason}
        </p>
      )}
      {error && (
        <p
          role="alert"
          data-doc-upload-error="true"
          className="mt-2 text-xs text-red-700 dark:text-red-400"
        >
          {error}
        </p>
      )}
      {okMessage && (
        <p
          data-doc-upload-ok="true"
          className="mt-2 text-xs text-emerald-800 dark:text-emerald-300"
        >
          {okMessage}
        </p>
      )}
    </form>
  );
}

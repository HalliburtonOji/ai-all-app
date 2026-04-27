"use client";

import { useState, useTransition } from "react";
import { updateProjectField } from "../actions";

interface EditableFieldProps {
  projectId: string;
  field: "name" | "description";
  initialValue: string;
  multiline?: boolean;
  emptyText?: string;
  displayClassName?: string;
  inputClassName?: string;
  maxLength?: number;
}

export function EditableField({
  projectId,
  field,
  initialValue,
  multiline = false,
  emptyText = "Click to add a description…",
  displayClassName = "",
  inputClassName = "",
  maxLength,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [isPending, startTransition] = useTransition();

  if (!editing) {
    const isEmpty = value.trim().length === 0;
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={`rounded-md text-left transition-colors hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 ${displayClassName}`}
        aria-label={`Edit ${field}`}
      >
        {isEmpty ? (
          <span className="text-zinc-500 italic">{emptyText}</span>
        ) : multiline ? (
          <span className="whitespace-pre-wrap">{value}</span>
        ) : (
          value
        )}
      </button>
    );
  }

  function handleSubmit(formData: FormData) {
    const next = ((formData.get("value") as string) ?? "").trim();
    if (field === "name" && next.length === 0) {
      return;
    }
    startTransition(async () => {
      await updateProjectField(formData);
      setValue(next);
      setEditing(false);
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <input type="hidden" name="id" value={projectId} />
      <input type="hidden" name="field" value={field} />
      {multiline ? (
        <textarea
          name="value"
          defaultValue={value}
          autoFocus
          rows={3}
          maxLength={maxLength}
          disabled={isPending}
          className={`flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-white ${inputClassName}`}
        />
      ) : (
        <input
          type="text"
          name="value"
          defaultValue={value}
          autoFocus
          required
          maxLength={maxLength}
          disabled={isPending}
          className={`flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-white ${inputClassName}`}
        />
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          disabled={isPending}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-black hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

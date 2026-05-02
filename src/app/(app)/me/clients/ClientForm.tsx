"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createClientRecord,
  updateClientRecord,
} from "./actions";
import {
  CLIENT_STATUSES,
  CLIENT_STATUS_LABELS,
  type ClientStatus,
} from "@/types/clients";

interface ClientFormProps {
  mode: "create" | "edit";
  /** Existing client values when editing. */
  initial?: {
    id: string;
    name: string;
    email: string | null;
    company: string | null;
    status: ClientStatus;
    notes: string | null;
  };
}

export function ClientForm({ mode, initial }: ClientFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [company, setCompany] = useState(initial?.company ?? "");
  const [status, setStatus] = useState<ClientStatus>(
    initial?.status ?? "active",
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result =
        mode === "edit"
          ? await updateClientRecord(formData)
          : await createClientRecord(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.clientId) {
        router.push(`/me/clients/${result.clientId}`);
      }
    });
  }

  return (
    <form
      action={onSubmit}
      data-client-form={mode}
      className="space-y-5 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      {mode === "edit" && initial && (
        <input type="hidden" name="id" value={initial.id} />
      )}

      <label className="block">
        <span className="block text-sm font-medium text-black dark:text-white">
          Name <span className="text-red-700">*</span>
        </span>
        <input
          type="text"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={200}
          placeholder="e.g. Acme Co."
          data-client-input="name"
          className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black placeholder:text-zinc-400 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
        />
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="block text-sm font-medium text-black dark:text-white">
            Email (optional)
          </span>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={200}
            placeholder="contact@acme.co"
            data-client-input="email"
            className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black placeholder:text-zinc-400 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-black dark:text-white">
            Company (optional)
          </span>
          <input
            type="text"
            name="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            maxLength={200}
            placeholder="Acme Corp."
            data-client-input="company"
            className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black placeholder:text-zinc-400 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
          />
        </label>
      </div>

      <label className="block">
        <span className="block text-sm font-medium text-black dark:text-white">
          Status
        </span>
        <select
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ClientStatus)}
          data-client-input="status"
          className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
        >
          {CLIENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {CLIENT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="block text-sm font-medium text-black dark:text-white">
          Notes
        </span>
        <textarea
          name="notes"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={4000}
          placeholder="What's the relationship like? Where did they come from? What do they care about?"
          data-client-input="notes"
          className="mt-1 block w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black placeholder:text-zinc-400 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
        />
      </label>

      {error && (
        <p
          role="alert"
          data-client-error="true"
          className="text-sm text-red-700 dark:text-red-400"
        >
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={isPending || name.trim().length === 0}
          data-client-submit={mode}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {isPending
            ? "Saving…"
            : mode === "edit"
              ? "Save changes"
              : "Add client"}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import { addEarning } from "./actions";
import {
  SUPPORTED_CURRENCIES,
  type Currency,
} from "@/types/earnings";

interface ProjectOption {
  id: string;
  name: string;
}

interface ClientOption {
  id: string;
  name: string;
}

export function AddEarningForm({
  projects,
  clients = [],
  defaultCurrency = "USD",
}: {
  projects: ProjectOption[];
  clients?: ClientOption[];
  defaultCurrency?: Currency;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const today = new Date().toISOString().slice(0, 10);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addEarning(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      // Successful submit: clear amount/source/note inputs by re-rendering
      // via a key bump — simplest approach is to reset the form.
      const form = document.querySelector<HTMLFormElement>(
        '[data-add-earning-form="true"]',
      );
      form?.reset();
    });
  }

  return (
    <form
      action={onSubmit}
      data-add-earning-form="true"
      className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="text-base font-semibold text-black dark:text-white">
        Log a payment
      </h2>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
        Manual entries only. We don&apos;t connect to your bank.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Amount
          </span>
          <input
            type="number"
            name="amount"
            step="0.01"
            min="0.01"
            required
            placeholder="100.00"
            data-earning-input="amount"
            className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black placeholder:text-zinc-400 focus:border-black focus:outline-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
          />
        </label>

        <label className="block text-sm">
          <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Currency
          </span>
          <select
            name="currency"
            defaultValue={defaultCurrency}
            data-earning-input="currency"
            className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm sm:col-span-2">
          <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            What was it for?
          </span>
          <input
            type="text"
            name="source"
            required
            maxLength={200}
            placeholder="Logo design for Acme Co."
            data-earning-input="source"
            className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black placeholder:text-zinc-400 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
          />
        </label>

        <label className="block text-sm">
          <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Date paid
          </span>
          <input
            type="date"
            name="occurred_on"
            required
            defaultValue={today}
            data-earning-input="occurred_on"
            className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
          />
        </label>

        <label className="block text-sm">
          <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Project (optional)
          </span>
          <select
            name="project_id"
            defaultValue=""
            data-earning-input="project_id"
            className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
          >
            <option value="">— none —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Client (optional)
          </span>
          <select
            name="client_id"
            defaultValue=""
            data-earning-input="client_id"
            className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
          >
            <option value="">— none —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm sm:col-span-2">
          <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Note (optional)
          </span>
          <textarea
            name="note"
            rows={2}
            maxLength={500}
            placeholder="Any context — failure stories welcome"
            data-earning-input="note"
            className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black placeholder:text-zinc-400 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
          />
        </label>
      </div>

      {error && (
        <p
          role="alert"
          data-earning-error="true"
          className="mt-3 text-sm text-red-700 dark:text-red-400"
        >
          {error}
        </p>
      )}

      <div className="mt-4 flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={isPending}
          data-earning-submit="true"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {isPending ? "Saving…" : "Log payment"}
        </button>
      </div>
    </form>
  );
}

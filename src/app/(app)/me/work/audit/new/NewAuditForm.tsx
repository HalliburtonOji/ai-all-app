"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createJobAudit } from "../../actions";

export function NewAuditForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createJobAudit(formData);
      if (result.auditId) {
        router.push(`/me/work/audit/${result.auditId}`);
        return;
      }
      if (result.error) {
        setError(result.error);
      }
    });
  }

  return (
    <form
      action={onSubmit}
      data-audit-form="true"
      className="space-y-5 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <label className="block">
        <span className="block text-sm font-medium text-black dark:text-white">
          What do you do? <span className="text-red-700">*</span>
        </span>
        <input
          type="text"
          name="job_title"
          required
          maxLength={200}
          placeholder="e.g. Freelance brand designer · Senior backend engineer · Year-3 secondary teacher"
          data-audit-input="job_title"
          className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black placeholder:text-zinc-400 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
        />
      </label>

      <label className="block">
        <span className="block text-sm font-medium text-black dark:text-white">
          Main responsibilities (skip if obvious from the title)
        </span>
        <textarea
          name="responsibilities"
          rows={3}
          maxLength={2000}
          placeholder="e.g. Design brand systems for early-stage SaaS clients; lead 2 designers"
          data-audit-input="responsibilities"
          className="mt-1 block w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black placeholder:text-zinc-400 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
        />
      </label>

      <label className="block">
        <span className="block text-sm font-medium text-black dark:text-white">
          Tasks that take most of your time
        </span>
        <textarea
          name="top_tasks"
          rows={3}
          maxLength={2000}
          placeholder="e.g. Client revisions, sourcing references, Slack updates, weekly status decks"
          data-audit-input="top_tasks"
          className="mt-1 block w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black placeholder:text-zinc-400 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
        />
      </label>

      <label className="block">
        <span className="block text-sm font-medium text-black dark:text-white">
          What worries you about AI in your role?
        </span>
        <textarea
          name="worries"
          rows={3}
          maxLength={2000}
          placeholder="e.g. Junior designers using AI feel cheaper than me. I don't know if I should compete on speed."
          data-audit-input="worries"
          className="mt-1 block w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black placeholder:text-zinc-400 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
        />
      </label>

      <label className="block">
        <span className="block text-sm font-medium text-black dark:text-white">
          What are you hoping AI helps you do?
        </span>
        <textarea
          name="hopes"
          rows={3}
          maxLength={2000}
          placeholder="e.g. Take on 30% more clients without burning out. Spend less time on Slack updates."
          data-audit-input="hopes"
          className="mt-1 block w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black placeholder:text-zinc-400 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
        />
      </label>

      {error && (
        <p
          role="alert"
          data-audit-error="true"
          className="text-sm text-red-700 dark:text-red-400"
        >
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={isPending}
          data-audit-submit="true"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {isPending ? "Generating your audit…" : "Generate my audit"}
        </button>
      </div>
    </form>
  );
}

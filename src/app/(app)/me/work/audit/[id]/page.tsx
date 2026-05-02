import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { createClient } from "@/utils/supabase/server";
import type { JobAudit } from "@/types/work";
import { AuditActions } from "./AuditActions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AuditDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_audits")
    .select(
      "id, user_id, job_title, responsibilities, top_tasks, worries, hopes, summary, model, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) notFound();

  const audit = data as JobAudit;
  const created = new Date(audit.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/me/work"
        className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
      >
        ← Back to Work
      </Link>

      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Audit · {created}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-black sm:text-4xl dark:text-white">
          {audit.job_title}
        </h1>
      </div>

      {audit.summary ? (
        <article
          data-audit-summary="true"
          data-audit-id={audit.id}
          data-audit-model={audit.model ?? ""}
          className="prose prose-zinc mt-8 max-w-none dark:prose-invert prose-headings:font-semibold prose-h2:mt-8 prose-h2:text-xl prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-strong:text-black dark:prose-strong:text-white"
        >
          <ReactMarkdown>{audit.summary}</ReactMarkdown>
        </article>
      ) : (
        <div
          data-audit-pending="true"
          className="mt-8 rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400"
        >
          The summary couldn&apos;t be generated. Try regenerating, or delete
          this audit and start a new one.
        </div>
      )}

      <details className="mt-10 rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
        <summary className="cursor-pointer font-medium text-black dark:text-white">
          Your inputs
        </summary>
        <dl className="mt-3 space-y-3">
          {audit.responsibilities && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Responsibilities
              </dt>
              <dd className="mt-1 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                {audit.responsibilities}
              </dd>
            </div>
          )}
          {audit.top_tasks && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Top tasks
              </dt>
              <dd className="mt-1 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                {audit.top_tasks}
              </dd>
            </div>
          )}
          {audit.worries && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Worries
              </dt>
              <dd className="mt-1 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                {audit.worries}
              </dd>
            </div>
          )}
          {audit.hopes && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Hopes
              </dt>
              <dd className="mt-1 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                {audit.hopes}
              </dd>
            </div>
          )}
        </dl>
      </details>

      <AuditActions auditId={audit.id} />
    </main>
  );
}

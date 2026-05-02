import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getAllProfessionPacks } from "@/lib/work/packs";
import type { JobAudit } from "@/types/work";

export default async function WorkLandingPage() {
  const supabase = await createClient();
  const { data: auditRows } = await supabase
    .from("job_audits")
    .select(
      "id, job_title, summary, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(10);

  const audits = (auditRows ?? []) as Array<
    Pick<JobAudit, "id" | "job_title" | "summary" | "created_at" | "updated_at">
  >;
  const packs = getAllProfessionPacks();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: "var(--work-accent)" }}
        />
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Work
        </p>
      </div>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-black sm:text-4xl dark:text-white">
        AI and your job
      </h1>
      <p className="mt-2 max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
        Two things in one place. <strong>Audit my job</strong> takes 5 minutes
        and gives you an honest, personalised report on where AI fits in your
        role. <strong>Profession packs</strong> are curated guides for common
        roles — what AI does well there, what it can&apos;t, what to invest in.
      </p>

      <section
        data-work-audit-section="true"
        className="mt-8 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            AI Audit of your job
          </h2>
          <Link
            href="/me/work/audit/new"
            data-work-new-audit="true"
            className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Start an audit
          </Link>
        </div>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Five short questions. The coach reads your answers and writes a plain-
          English report — no doom, no hype, just the boring middle truth.
        </p>

        {audits.length > 0 && (
          <ul
            data-work-audit-list="true"
            className="mt-5 divide-y divide-zinc-200 dark:divide-zinc-800"
          >
            {audits.map((a) => (
              <li
                key={a.id}
                data-audit-id={a.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-black dark:text-white">
                    {a.job_title}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500">
                    {new Date(a.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                    {!a.summary && " · summary pending"}
                  </p>
                </div>
                <Link
                  href={`/me/work/audit/${a.id}`}
                  className="text-sm text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
                >
                  Open →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section data-work-packs-section="true" className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            Profession packs
          </h2>
          <Link
            href="/me/work/packs"
            className="text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
          >
            Browse all →
          </Link>
        </div>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Curated, opinionated, version-controlled guides for the roles AI hits
          hardest.
        </p>

        <ul
          data-work-packs-grid="true"
          className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {packs.slice(0, 6).map((p) => (
            <li key={p.slug}>
              <Link
                href={`/me/work/packs/${p.slug}`}
                data-pack-slug={p.slug}
                className="block h-full rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Pack
                </p>
                <h3 className="mt-1 text-base font-semibold text-black dark:text-white">
                  {p.title}
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {p.summary}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

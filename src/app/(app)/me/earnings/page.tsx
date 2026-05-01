import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import {
  formatAmount,
  type Currency,
  type Earning,
} from "@/types/earnings";
import { AddEarningForm } from "./AddEarningForm";
import { EarningRow } from "./EarningRow";
import { EarningsChart } from "./EarningsChart";

export default async function EarningsPage() {
  const supabase = await createClient();

  const [{ data: earningRows }, { data: projectRows }] = await Promise.all([
    supabase
      .from("earnings")
      .select(
        "id, user_id, project_id, amount_cents, currency, source, occurred_on, note, created_at",
      )
      .order("occurred_on", { ascending: false })
      .limit(500),
    supabase
      .from("projects")
      .select("id, name")
      .order("updated_at", { ascending: false }),
  ]);

  const earnings = (earningRows ?? []) as Earning[];
  const projects = (projectRows ?? []) as Array<{ id: string; name: string }>;
  const projectLookup: Record<string, string> = {};
  for (const p of projects) projectLookup[p.id] = p.name;

  // Lifetime totals per currency (no FX — each currency stands alone).
  const totals = new Map<Currency, number>();
  for (const e of earnings) {
    totals.set(e.currency, (totals.get(e.currency) ?? 0) + e.amount_cents);
  }
  const totalsList = Array.from(totals.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Earnings
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-black sm:text-4xl dark:text-white">
            What you&apos;ve made
          </h1>
        </div>
        <a
          href="/api/me/earnings/export"
          data-earnings-export="true"
          download
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
        >
          Export CSV
        </a>
      </div>

      <section
        data-earnings-totals="true"
        className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <h2 className="text-base font-semibold text-black dark:text-white">
          Lifetime
        </h2>
        {totalsList.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            No payments logged yet. Add one below — failure stories welcome too.
          </p>
        ) : (
          <ul className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2">
            {totalsList.map(([currency, cents]) => (
              <li
                key={currency}
                data-earnings-total-currency={currency}
                className="flex items-baseline gap-2"
              >
                <span className="text-2xl font-bold text-black dark:text-white">
                  {formatAmount(cents, currency)}
                </span>
                <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {currency}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6">
        <EarningsChart earnings={earnings} />
      </div>

      <div className="mt-6">
        <AddEarningForm projects={projects} />
      </div>

      <section className="mt-8">
        <h2 className="text-base font-semibold text-black dark:text-white">
          History
        </h2>
        {earnings.length === 0 ? (
          <p
            data-earnings-empty="true"
            className="mt-3 rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400"
          >
            Once you log a payment it&apos;ll show up here.
          </p>
        ) : (
          <ul
            data-earnings-list="true"
            className="mt-3 rounded-lg border border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            {earnings.map((e) => (
              <EarningRow
                key={e.id}
                earning={e}
                projects={projectLookup}
              />
            ))}
          </ul>
        )}
      </section>

      <p className="mt-10 text-xs text-zinc-500 dark:text-zinc-500">
        <Link href="/dashboard" className="underline-offset-2 hover:underline">
          ← Back to dashboard
        </Link>
      </p>
    </main>
  );
}

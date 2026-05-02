import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ClientForm } from "../ClientForm";
import { DeleteClientButton } from "./DeleteClientButton";
import {
  CLIENT_STATUS_LABELS,
  type Client,
  type ClientStatus,
} from "@/types/clients";
import { formatAmount, type Currency } from "@/types/earnings";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: clientRow } = await supabase
    .from("clients")
    .select(
      "id, user_id, name, email, company, status, notes, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (!clientRow) notFound();
  const client = clientRow as Client;

  // Linked earnings — most recent first.
  const { data: earnRows } = await supabase
    .from("earnings")
    .select("id, amount_cents, currency, source, occurred_on")
    .eq("client_id", id)
    .order("occurred_on", { ascending: false })
    .limit(20);

  const earnings = (earnRows ?? []) as Array<{
    id: string;
    amount_cents: number;
    currency: Currency;
    source: string;
    occurred_on: string;
  }>;

  // Per-currency totals across linked earnings.
  const totals = new Map<Currency, number>();
  for (const e of earnings) {
    totals.set(e.currency, (totals.get(e.currency) ?? 0) + e.amount_cents);
  }
  const totalsList = Array.from(totals.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/me/clients"
        className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
      >
        ← Back to clients
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Client · {CLIENT_STATUS_LABELS[client.status as ClientStatus]}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-black sm:text-4xl dark:text-white">
            {client.name}
          </h1>
          {(client.company || client.email) && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {[client.company, client.email].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </header>

      {totalsList.length > 0 && (
        <section
          data-client-earnings="true"
          className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <h2 className="text-sm font-semibold text-black dark:text-white">
            Lifetime from this client
          </h2>
          <ul className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-2">
            {totalsList.map(([currency, cents]) => (
              <li key={currency} className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-black dark:text-white">
                  {formatAmount(cents, currency)}
                </span>
                <span className="text-xs uppercase tracking-wide text-zinc-500">
                  {currency}
                </span>
              </li>
            ))}
          </ul>
          <ul
            data-client-earnings-list="true"
            className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800"
          >
            {earnings.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <span className="text-black dark:text-white">{e.source}</span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  {formatAmount(e.amount_cents, e.currency)} · {e.occurred_on}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-base font-semibold text-black dark:text-white">
          Edit client
        </h2>
        <div className="mt-3">
          <ClientForm
            mode="edit"
            initial={{
              id: client.id,
              name: client.name,
              email: client.email,
              company: client.company,
              status: client.status as ClientStatus,
              notes: client.notes,
            }}
          />
        </div>
      </section>

      <div className="mt-8 flex items-center justify-end border-t border-zinc-200 pt-5 dark:border-zinc-800">
        <DeleteClientButton clientId={client.id} />
      </div>
    </main>
  );
}

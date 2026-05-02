import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import {
  CLIENT_STATUS_LABELS,
  type Client,
  type ClientStatus,
} from "@/types/clients";

export default async function ClientsListPage() {
  const supabase = await createClient();
  const { data: clientRows } = await supabase
    .from("clients")
    .select("id, name, email, company, status, created_at")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });

  const clients = (clientRows ?? []) as Array<
    Pick<Client, "id" | "name" | "email" | "company" | "status" | "created_at">
  >;

  // Group by status so the page reads "active first, then paused, then past."
  const byStatus: Record<ClientStatus, typeof clients> = {
    active: [],
    paused: [],
    past: [],
  };
  for (const c of clients) byStatus[c.status as ClientStatus].push(c);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: "var(--earn-accent)" }}
            />
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Clients
            </p>
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-black sm:text-4xl dark:text-white">
            Your client roster
          </h1>
          <p className="mt-2 max-w-xl text-base text-zinc-600 dark:text-zinc-400">
            Manual roster of who you work with — active, paused, or done. Link
            an earning to a client when you log it for a clean view of who paid
            you what.
          </p>
        </div>
        <Link
          href="/me/clients/new"
          data-clients-new-button="true"
          className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          + New client
        </Link>
      </div>

      {clients.length === 0 ? (
        <div
          data-clients-empty="true"
          className="mt-8 rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-950"
        >
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No clients yet. Add your first one — past clients count too.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {(["active", "paused", "past"] as ClientStatus[]).map((s) => {
            const list = byStatus[s];
            if (list.length === 0) return null;
            return (
              <section key={s} data-clients-status-section={s}>
                <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
                  {CLIENT_STATUS_LABELS[s]} · {list.length}
                </h2>
                <ul
                  data-clients-status-list={s}
                  className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                  {list.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/me/clients/${c.id}`}
                        data-client-id={c.id}
                        className="block rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
                      >
                        <p className="text-base font-semibold text-black dark:text-white">
                          {c.name}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                          {[c.company, c.email].filter(Boolean).join(" · ") ||
                            "no contact info"}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <p className="mt-12 text-xs text-zinc-500 dark:text-zinc-500">
        <Link href="/dashboard" className="underline-offset-2 hover:underline">
          ← Back to dashboard
        </Link>
      </p>
    </main>
  );
}

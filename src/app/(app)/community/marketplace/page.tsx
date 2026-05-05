import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import {
  STATUS_LABEL,
  type MarketplaceListing,
} from "@/types/marketplace";

export default async function MarketplacePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Two queries:
  //  - active listings from anyone (RLS-allowed)
  //  - the current user's own listings (any status)
  const [{ data: activeRows }, { data: ownRows }] = await Promise.all([
    supabase
      .from("marketplace_listings")
      .select(
        "id, user_id, title, summary, body, price_text, tags, status, created_at, updated_at",
      )
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(60),
    user
      ? supabase
          .from("marketplace_listings")
          .select(
            "id, user_id, title, summary, body, price_text, tags, status, created_at, updated_at",
          )
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
      : Promise.resolve({ data: [] as MarketplaceListing[] }),
  ]);

  const active = (activeRows ?? []) as MarketplaceListing[];
  const own = (ownRows ?? []) as MarketplaceListing[];
  // Filter out the user's own active listings from the public list to
  // avoid showing the same row twice.
  const publicOnly = active.filter((l) => l.user_id !== user?.id);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href="/wins"
        className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
      >
        ← All community
      </Link>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--brand-strong)] shadow-sm">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--community-accent)]"
            />
            Community · Marketplace
          </div>
          <h1 className="mt-3 text-4xl font-semibold leading-[0.95] tracking-tight text-[var(--foreground)] sm:text-5xl">
            Things people are offering.
          </h1>
          <p className="mt-3 max-w-2xl text-base text-zinc-700 dark:text-zinc-300">
            Listings only — no payments, no fees, no escrow. Buyers reach out
            via the seller&apos;s public portfolio.
          </p>
        </div>
        <Link
          href="/community/marketplace/new"
          data-marketplace-new="true"
          className="rounded-md bg-[var(--brand)] px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[var(--brand-strong)] hover:shadow-md"
        >
          + New listing
        </Link>
      </div>

      {/* OWN LISTINGS */}
      {own.length > 0 && (
        <section data-marketplace-own="true" className="mt-12">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Your listings
          </h2>
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {own.map((l) => (
              <li
                key={l.id}
                data-listing-id={l.id}
                className="bento-tile rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {l.title}
                  </p>
                  <span
                    data-listing-status-badge={l.status}
                    className={
                      "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide " +
                      (l.status === "active"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300")
                    }
                  >
                    {STATUS_LABEL[l.status]}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-zinc-700 dark:text-zinc-300">
                  {l.summary}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <Link
                    href={`/community/marketplace/${l.id}`}
                    className="font-medium text-[var(--brand-strong)] underline-offset-2 hover:underline"
                  >
                    View / edit →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* PUBLIC LISTINGS */}
      <section data-marketplace-list="true" className="mt-12">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Active across the community
        </h2>
        {publicOnly.length === 0 ? (
          <p
            data-marketplace-empty="true"
            className="mt-4 rounded-lg border border-dashed border-[var(--border-soft)] bg-[var(--surface)] p-6 text-sm text-zinc-700 dark:text-zinc-300"
          >
            No active listings yet. Be the first to post one.
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publicOnly.map((l) => (
              <li
                key={l.id}
                data-public-listing-id={l.id}
                className="bento-tile rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-5"
              >
                <p className="text-base font-semibold text-[var(--foreground)]">
                  {l.title}
                </p>
                <p className="mt-2 line-clamp-3 text-sm text-zinc-700 dark:text-zinc-300">
                  {l.summary}
                </p>
                {l.price_text && (
                  <p className="mt-3 text-xs font-medium text-[var(--brand-strong)]">
                    {l.price_text}
                  </p>
                )}
                {l.tags.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {l.tags.slice(0, 6).map((t) => (
                      <li
                        key={t}
                        className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-400"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  href={`/community/marketplace/${l.id}`}
                  className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--brand-strong)] underline-offset-2 hover:underline"
                >
                  See full listing →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

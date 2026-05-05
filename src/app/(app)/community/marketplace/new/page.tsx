import Link from "next/link";
import { ListingForm } from "../ListingForm";

export default function NewMarketplaceListingPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href="/community/marketplace"
        className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
      >
        ← Back to marketplace
      </Link>
      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--brand-strong)] shadow-sm">
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--community-accent)]"
        />
        New listing
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
        Offer something to the community.
      </h1>
      <p className="mt-3 max-w-xl text-base text-zinc-700 dark:text-zinc-300">
        No fees, no escrow, no platform cuts. Just a listing. Buyers reach out
        via your public portfolio.
      </p>
      <div className="mt-8 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] p-6 sm:p-8">
        <ListingForm listing={null} />
      </div>
    </main>
  );
}

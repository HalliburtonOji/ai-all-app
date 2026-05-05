import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import {
  STATUS_LABEL,
  type MarketplaceListing,
} from "@/types/marketplace";
import { deriveUsername } from "@/lib/portfolio/username";
import { ListingForm } from "../ListingForm";
import { DeleteListingButton } from "../DeleteListingButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MarketplaceListingPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: row } = await supabase
    .from("marketplace_listings")
    .select(
      "id, user_id, title, summary, body, price_text, tags, status, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (!row) notFound();
  const listing = row as MarketplaceListing;
  const isOwner = user?.id === listing.user_id;

  // Resolve seller's username for the "reach out via portfolio" link.
  let sellerUsername: string | null = null;
  if (!isOwner) {
    const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (adminUrl && adminKey) {
      const admin = createServiceClient(adminUrl, adminKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: list } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      const seller = (list?.users ?? []).find((u) => u.id === listing.user_id);
      if (seller?.email) sellerUsername = deriveUsername(seller.email);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href="/community/marketplace"
        className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
      >
        ← Back to marketplace
      </Link>

      {isOwner ? (
        <>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--brand-strong)] shadow-sm">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--community-accent)]"
            />
            Your listing · {STATUS_LABEL[listing.status]}
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
            Edit listing
          </h1>
          <div
            data-listing-edit-view="true"
            className="mt-8 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] p-6 sm:p-8"
          >
            <ListingForm listing={listing} />
          </div>
          <div className="mt-6 flex justify-end">
            <DeleteListingButton listingId={listing.id} />
          </div>
        </>
      ) : (
        <article
          data-listing-detail-view="true"
          className="mt-6 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] p-6 sm:p-8"
        >
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
            {listing.title}
          </h1>
          <p className="mt-3 text-base leading-7 text-zinc-700 dark:text-zinc-300">
            {listing.summary}
          </p>
          {listing.price_text && (
            <p className="mt-4 text-sm font-medium text-[var(--brand-strong)]">
              {listing.price_text}
            </p>
          )}
          {listing.tags.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {listing.tags.map((t) => (
                <li
                  key={t}
                  className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-400"
                >
                  {t}
                </li>
              ))}
            </ul>
          )}
          {listing.body && (
            <div
              className="prose prose-zinc mt-8 max-w-none whitespace-pre-wrap text-sm dark:prose-invert"
              data-listing-body="true"
            >
              {listing.body}
            </div>
          )}
          {sellerUsername && (
            <p className="mt-10 rounded-lg border border-[var(--brand-strong)] bg-[var(--brand-soft)] p-4 text-sm text-[var(--brand-ink)]">
              <strong>Interested?</strong> Reach out via the seller&apos;s
              public portfolio:{" "}
              <Link
                href={`/p/${sellerUsername}`}
                className="font-semibold underline-offset-2 hover:underline"
              >
                /p/{sellerUsername}
              </Link>
              .
            </p>
          )}
        </article>
      )}
    </main>
  );
}

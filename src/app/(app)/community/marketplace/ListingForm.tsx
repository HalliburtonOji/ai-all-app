"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createMarketplaceListing,
  updateMarketplaceListing,
} from "./actions";
import {
  MAX_BODY_LENGTH,
  MAX_PRICE_TEXT_LENGTH,
  MAX_SUMMARY_LENGTH,
  MAX_TITLE_LENGTH,
  STATUS_LABEL,
  type MarketplaceListing,
  type MarketplaceListingStatus,
} from "@/types/marketplace";

const STATUS_OPTIONS: MarketplaceListingStatus[] = [
  "draft",
  "active",
  "paused",
  "closed",
];

export function ListingForm({
  listing,
}: {
  listing: MarketplaceListing | null;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(listing?.title ?? "");
  const [summary, setSummary] = useState(listing?.summary ?? "");
  const [body, setBody] = useState(listing?.body ?? "");
  const [priceText, setPriceText] = useState(listing?.price_text ?? "");
  const [status, setStatus] = useState<MarketplaceListingStatus>(
    listing?.status ?? "active",
  );
  const [tagsRaw, setTagsRaw] = useState((listing?.tags ?? []).join(", "));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit() {
    setError(null);
    const formData = new FormData();
    if (listing) formData.set("id", listing.id);
    formData.set("title", title);
    formData.set("summary", summary);
    formData.set("body", body);
    formData.set("price_text", priceText);
    formData.set("status", status);
    formData.set("tags", tagsRaw);

    startTransition(async () => {
      const result = listing
        ? await updateMarketplaceListing(formData)
        : await createMarketplaceListing(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/community/marketplace/${result.listingId}`);
    });
  }

  return (
    <div data-listing-form="true" className="space-y-4">
      <label className="block text-sm">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Title <span className="text-red-700">*</span>
        </span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={MAX_TITLE_LENGTH}
          required
          placeholder="e.g. Brand identity sprint — fast, calm, principled"
          data-listing-title="true"
          className="mt-1 block w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)]"
        />
      </label>

      <label className="block text-sm">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Summary <span className="text-red-700">*</span>
        </span>
        <textarea
          rows={3}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          maxLength={MAX_SUMMARY_LENGTH}
          required
          placeholder="One short paragraph. What you offer, who it's for, why it's worth their time."
          data-listing-summary="true"
          className="mt-1 block w-full resize-y rounded-md border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)]"
        />
      </label>

      <label className="block text-sm">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Detail (optional)
        </span>
        <textarea
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={MAX_BODY_LENGTH}
          placeholder="Process, what's included, what you need from them, anything that filters in serious buyers and out tire-kickers."
          data-listing-body="true"
          className="mt-1 block w-full resize-y rounded-md border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)]"
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Pricing line
          </span>
          <input
            type="text"
            value={priceText}
            onChange={(e) => setPriceText(e.target.value)}
            maxLength={MAX_PRICE_TEXT_LENGTH}
            placeholder='e.g. "Starting at $1,500" or "Email for a quote"'
            data-listing-price="true"
            className="mt-1 block w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)]"
          />
          <span className="mt-1 block text-xs text-zinc-500">
            Free-form. No structured pricing yet.
          </span>
        </label>

        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Status
          </span>
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as MarketplaceListingStatus)
            }
            data-listing-status="true"
            className="mt-1 block w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)]"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-zinc-500">
            Only &ldquo;Active&rdquo; is visible to other authenticated users.
          </span>
        </label>
      </div>

      <label className="block text-sm">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Tags
        </span>
        <input
          type="text"
          value={tagsRaw}
          onChange={(e) => setTagsRaw(e.target.value)}
          placeholder="comma, separated, lowercase, max 8"
          data-listing-tags="true"
          className="mt-1 block w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)]"
        />
      </label>

      {error && (
        <p
          role="alert"
          data-listing-error="true"
          className="text-sm text-red-700 dark:text-red-400"
        >
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isPending}
          className="rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/5"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isPending || !title.trim() || !summary.trim()}
          data-listing-save="true"
          className="rounded-md bg-[var(--brand)] px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-[var(--brand-strong)] disabled:opacity-50"
        >
          {isPending
            ? "Saving…"
            : listing
              ? "Save changes"
              : "Publish listing"}
        </button>
      </div>
    </div>
  );
}

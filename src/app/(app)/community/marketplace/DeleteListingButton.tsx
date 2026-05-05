"use client";

import { useState, useTransition } from "react";
import { deleteMarketplaceListing } from "./actions";

export function DeleteListingButton({ listingId }: { listingId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    const formData = new FormData();
    formData.set("id", listingId);
    startTransition(async () => {
      await deleteMarketplaceListing(formData);
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        data-listing-delete-button="true"
        className="rounded-md px-3 py-1.5 text-xs text-zinc-600 hover:bg-black/5 hover:text-red-700 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-red-400"
      >
        Delete listing
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onDelete}
        disabled={isPending}
        data-listing-confirm-delete="true"
        className="rounded-md border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        Confirm delete
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-black/5"
      >
        Cancel
      </button>
    </div>
  );
}

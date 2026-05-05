"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  MAX_BODY_LENGTH,
  MAX_LISTING_TAGS,
  MAX_LISTING_TAG_LENGTH,
  MAX_PRICE_TEXT_LENGTH,
  MAX_SUMMARY_LENGTH,
  MAX_TITLE_LENGTH,
  type MarketplaceListingStatus,
} from "@/types/marketplace";

const VALID_STATUSES: ReadonlySet<MarketplaceListingStatus> = new Set([
  "draft",
  "active",
  "paused",
  "closed",
]);

export interface SaveListingResult {
  listingId?: string;
  error?: string;
}

function normaliseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .map((t) => t.slice(0, MAX_LISTING_TAG_LENGTH))
    .filter((t, i, arr) => arr.indexOf(t) === i)
    .slice(0, MAX_LISTING_TAGS);
}

function readListingFields(formData: FormData) {
  const title = ((formData.get("title") as string) ?? "").trim();
  const summary = ((formData.get("summary") as string) ?? "").trim();
  const body = ((formData.get("body") as string) ?? "").trim();
  const priceText = ((formData.get("price_text") as string) ?? "").trim();
  const statusRaw = ((formData.get("status") as string) ?? "active").trim();
  const tagsRaw = ((formData.get("tags") as string) ?? "").trim();

  if (!title) return { error: "Title is required." };
  if (title.length > MAX_TITLE_LENGTH) {
    return { error: `Title must be ${MAX_TITLE_LENGTH} characters or fewer.` };
  }
  if (!summary) return { error: "Summary is required." };
  if (summary.length > MAX_SUMMARY_LENGTH) {
    return { error: `Summary must be ${MAX_SUMMARY_LENGTH} characters or fewer.` };
  }
  if (body.length > MAX_BODY_LENGTH) {
    return { error: `Body must be ${MAX_BODY_LENGTH} characters or fewer.` };
  }
  if (priceText.length > MAX_PRICE_TEXT_LENGTH) {
    return { error: `Price text must be ${MAX_PRICE_TEXT_LENGTH} characters or fewer.` };
  }
  if (!VALID_STATUSES.has(statusRaw as MarketplaceListingStatus)) {
    return { error: "Invalid status." };
  }
  return {
    title,
    summary,
    body: body || null,
    priceText: priceText || null,
    status: statusRaw as MarketplaceListingStatus,
    tags: normaliseTags(tagsRaw),
  } as const;
}

export async function createMarketplaceListing(
  formData: FormData,
): Promise<SaveListingResult> {
  const fields = readListingFields(formData);
  if ("error" in fields) return { error: fields.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: row, error } = await supabase
    .from("marketplace_listings")
    .insert({
      user_id: user.id,
      title: fields.title,
      summary: fields.summary,
      body: fields.body,
      price_text: fields.priceText,
      status: fields.status,
      tags: fields.tags,
    })
    .select("id")
    .single();
  if (error || !row) return { error: "Could not save — try again." };

  revalidatePath("/community/marketplace");
  return { listingId: row.id };
}

export async function updateMarketplaceListing(
  formData: FormData,
): Promise<SaveListingResult> {
  const id = ((formData.get("id") as string) ?? "").trim();
  if (!id) return { error: "Missing listing id" };
  const fields = readListingFields(formData);
  if ("error" in fields) return { error: fields.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("marketplace_listings")
    .update({
      title: fields.title,
      summary: fields.summary,
      body: fields.body,
      price_text: fields.priceText,
      status: fields.status,
      tags: fields.tags,
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: "Could not update — try again." };

  revalidatePath("/community/marketplace");
  revalidatePath(`/community/marketplace/${id}`);
  return { listingId: id };
}

export async function deleteMarketplaceListing(formData: FormData) {
  const id = ((formData.get("id") as string) ?? "").trim();
  if (!id) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("marketplace_listings")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  revalidatePath("/community/marketplace");
  redirect("/community/marketplace");
}

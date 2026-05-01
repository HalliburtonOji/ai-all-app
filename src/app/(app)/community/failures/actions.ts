"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

const MAX_BODY_LENGTH = 2_000;
const DAILY_POST_LIMIT = 5;

export interface PostFailureResult {
  noteId?: string;
  error?: string;
}

/**
 * Post a failure note. Caps each user at DAILY_POST_LIMIT posts per
 * 24-hour rolling window — keeps the feed from getting drowned by a
 * single user. Server-side check; trivial to bypass via direct insert
 * but RLS still owns auth + ownership.
 */
export async function postFailureNote(
  formData: FormData,
): Promise<PostFailureResult> {
  const body = ((formData.get("body") as string) ?? "").trim();
  if (!body) return { error: "Write something first" };
  if (body.length > MAX_BODY_LENGTH) {
    return { error: `Note must be ${MAX_BODY_LENGTH} chars or fewer` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Rate limit: count this user's posts in the last 24h.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("failure_notes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since);

  if ((count ?? 0) >= DAILY_POST_LIMIT) {
    return {
      error: `Daily limit reached (${DAILY_POST_LIMIT} per 24h). Failure deserves time to settle anyway.`,
    };
  }

  const { data, error } = await supabase
    .from("failure_notes")
    .insert({ user_id: user.id, body })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Could not save note" };
  }

  revalidatePath("/community/failures");
  return { noteId: data.id };
}

export async function deleteFailureNote(formData: FormData) {
  const id = ((formData.get("id") as string) ?? "").trim();
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("failure_notes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/community/failures");
}

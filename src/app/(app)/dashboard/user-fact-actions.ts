"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  extractUserFacts,
  type UserExtractionResult,
} from "@/lib/coach/extract-user-facts";

const MAX_FACT_LENGTH = 500;

export async function updateUserFact(formData: FormData) {
  const factId = formData.get("id") as string;
  const rawFact = ((formData.get("fact") as string) ?? "").trim();
  if (!factId) return;
  if (rawFact.length === 0 || rawFact.length > MAX_FACT_LENGTH) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("user_facts")
    .update({ fact: rawFact })
    .eq("id", factId)
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
}

export async function deleteUserFact(formData: FormData) {
  const factId = formData.get("id") as string;
  if (!factId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("user_facts")
    .delete()
    .eq("id", factId)
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
}

export async function togglePinUserFact(formData: FormData) {
  const factId = formData.get("id") as string;
  const currentlyPinned = formData.get("currently_pinned") === "true";
  if (!factId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("user_facts")
    .update({ pinned: !currentlyPinned })
    .eq("id", factId)
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
}

/**
 * Manual trigger for user-fact extraction. Admin-gated via ADMIN_USER_ID
 * (bypassed in E2E_TEST_MODE so tests can drive it).
 */
export async function manuallyExtractUserFacts(): Promise<
  UserExtractionResult | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const isTestMode = process.env.E2E_TEST_MODE === "true";
  const adminId = process.env.ADMIN_USER_ID;
  if (!isTestMode && (!adminId || user.id !== adminId)) {
    return { error: "Not authorized" };
  }

  const result = await extractUserFacts(supabase, user.id);
  revalidatePath("/dashboard");
  return result;
}

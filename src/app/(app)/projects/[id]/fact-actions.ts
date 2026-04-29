"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

const MAX_FACT_LENGTH = 500;

/**
 * Update the text of a fact. RLS enforces ownership; app-level check
 * is defense-in-depth.
 */
export async function updateFact(formData: FormData) {
  const factId = formData.get("id") as string;
  const projectId = formData.get("project_id") as string;
  const rawFact = ((formData.get("fact") as string) ?? "").trim();
  if (!factId || !projectId) return;
  if (rawFact.length === 0 || rawFact.length > MAX_FACT_LENGTH) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("project_facts")
    .update({ fact: rawFact })
    .eq("id", factId)
    .eq("user_id", user.id);

  revalidatePath(`/projects/${projectId}`);
}

export async function deleteFact(formData: FormData) {
  const factId = formData.get("id") as string;
  const projectId = formData.get("project_id") as string;
  if (!factId || !projectId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("project_facts")
    .delete()
    .eq("id", factId)
    .eq("user_id", user.id);

  revalidatePath(`/projects/${projectId}`);
}

export async function togglePinFact(formData: FormData) {
  const factId = formData.get("id") as string;
  const projectId = formData.get("project_id") as string;
  const currentlyPinned = formData.get("currently_pinned") === "true";
  if (!factId || !projectId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("project_facts")
    .update({ pinned: !currentlyPinned })
    .eq("id", factId)
    .eq("user_id", user.id);

  revalidatePath(`/projects/${projectId}`);
}

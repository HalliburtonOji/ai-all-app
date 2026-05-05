"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  MAX_BIO_LENGTH,
  MAX_PATH_LENGTH,
  MAX_TAGS,
  MAX_TAG_LENGTH,
} from "@/types/mates";

export interface UpsertSignalResult {
  ok?: boolean;
  error?: string;
}

function normaliseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .map((t) => t.slice(0, MAX_TAG_LENGTH))
    .filter((t, i, arr) => arr.indexOf(t) === i)
    .slice(0, MAX_TAGS);
}

export async function upsertPathMateSignal(
  formData: FormData,
): Promise<UpsertSignalResult> {
  const path = ((formData.get("path") as string) ?? "").trim();
  const bio = ((formData.get("bio") as string) ?? "").trim();
  const tagsRaw = ((formData.get("tags") as string) ?? "").trim();
  const isPublic = (formData.get("is_public") as string) === "on";

  if (!path) return { error: "Tell us what path you're on." };
  if (path.length > MAX_PATH_LENGTH) {
    return { error: `Path must be ${MAX_PATH_LENGTH} characters or fewer.` };
  }
  if (bio.length > MAX_BIO_LENGTH) {
    return { error: `Bio must be ${MAX_BIO_LENGTH} characters or fewer.` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const tags = normaliseTags(tagsRaw);

  const { error } = await supabase.from("path_mate_signals").upsert(
    {
      user_id: user.id,
      path,
      bio: bio || null,
      tags,
      is_public: isPublic,
    },
    { onConflict: "user_id" },
  );

  if (error) return { error: "Could not save — try again." };

  revalidatePath("/community/mates");
  return { ok: true };
}

export async function deletePathMateSignal() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("path_mate_signals")
    .delete()
    .eq("user_id", user.id);
  revalidatePath("/community/mates");
}

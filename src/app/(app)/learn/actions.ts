"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getLessonBySlug } from "@/lib/learn/lessons";

/**
 * Toggle a lesson's completion. If the row doesn't exist, insert as
 * 'completed' (covers the "user clicked Mark complete without first
 * being recorded as started" path).
 *
 * Auto-marking a lesson as 'started' on first view is done inline in
 * the player page, not via a server action — calling revalidatePath
 * during page render is not allowed in Next.js.
 */
export async function setLessonComplete(formData: FormData) {
  const slug = (formData.get("slug") as string) ?? "";
  const completedRaw = (formData.get("completed") as string) ?? "true";
  const completed = completedRaw === "true";

  const lesson = getLessonBySlug(slug);
  if (!lesson) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("user_lesson_progress")
    .select("id")
    .eq("user_id", user.id)
    .eq("lesson_slug", slug)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("user_lesson_progress")
      .update({
        status: completed ? "completed" : "started",
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq("id", existing.id)
      .eq("user_id", user.id);
  } else {
    await supabase.from("user_lesson_progress").insert({
      user_id: user.id,
      lesson_slug: slug,
      status: completed ? "completed" : "started",
      completed_at: completed ? new Date().toISOString() : null,
    });
  }

  revalidatePath("/learn");
  revalidatePath(`/learn/${slug}`);
  revalidatePath("/dashboard");
}

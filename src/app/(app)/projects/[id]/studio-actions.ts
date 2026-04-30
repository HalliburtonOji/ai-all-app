"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { generateImageForProject } from "@/lib/studio/generate-image";
import { buildStudioMemoryHint } from "@/lib/coach/build-memory";
import type { ProjectFact, UserFact } from "@/types/coach";

const BUCKET = "studio-images";
const MAX_PROMPT_LENGTH = 1000;

export interface GenerateImageActionResult {
  imageId?: string;
  error?: string;
}

export async function generateImage(
  formData: FormData,
): Promise<GenerateImageActionResult> {
  const projectId = (formData.get("project_id") as string) ?? "";
  const prompt = ((formData.get("prompt") as string) ?? "").trim();

  if (!projectId) return { error: "Missing project id" };
  if (prompt.length === 0) return { error: "Prompt is required" };
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return { error: `Prompt must be ${MAX_PROMPT_LENGTH} characters or fewer` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: project } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project || project.user_id !== user.id) {
    return { error: "Project not found" };
  }

  // Load memory facts so the image is informed by what the coach
  // already remembers about this project + this user. The hint is
  // capped at 200 chars to avoid blowing FLUX's prompt window.
  const [{ data: pfRows }, { data: ufRows }] = await Promise.all([
    supabase
      .from("project_facts")
      .select("id, fact, pinned, created_at")
      .eq("project_id", projectId)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("user_facts")
      .select("id, fact, pinned, created_at")
      .eq("user_id", user.id)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10),
  ]);
  const memoryHint = buildStudioMemoryHint(
    (pfRows ?? []) as ProjectFact[],
    (ufRows ?? []) as UserFact[],
  );

  const result = await generateImageForProject(
    supabase,
    user.id,
    projectId,
    prompt,
    memoryHint,
  );

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(`/projects/${projectId}`);
  return { imageId: result.imageId };
}

export async function deleteImage(formData: FormData) {
  const imageId = (formData.get("id") as string) ?? "";
  const projectId = (formData.get("project_id") as string) ?? "";
  if (!imageId || !projectId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: row } = await supabase
    .from("studio_images")
    .select("id, storage_path, user_id")
    .eq("id", imageId)
    .maybeSingle();

  if (!row || row.user_id !== user.id) return;

  await supabase.storage.from(BUCKET).remove([row.storage_path]);
  await supabase
    .from("studio_images")
    .delete()
    .eq("id", imageId)
    .eq("user_id", user.id);

  revalidatePath(`/projects/${projectId}`);
}

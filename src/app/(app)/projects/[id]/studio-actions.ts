"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { generateImageForProject } from "@/lib/studio/generate-image";
import {
  generateTextDraftForProject,
  type TextDraftKind,
} from "@/lib/studio/generate-text";
import { generateVoiceOverForProject } from "@/lib/studio/generate-voice";
import { buildStudioMemoryHint } from "@/lib/coach/build-memory";
import { getUserApiKey } from "@/lib/byok/get-key";
import type { ProjectFact, UserFact } from "@/types/coach";

const BUCKET = "studio-images";
const MAX_IMAGE_PROMPT_LENGTH = 1000;
const MAX_TEXT_PROMPT_LENGTH = 2000;
const MAX_VOICE_SCRIPT_LENGTH = 500;

const VALID_TEXT_KINDS: ReadonlySet<TextDraftKind> = new Set([
  "email",
  "social_post",
  "caption",
  "general",
]);

interface OwnedProjectContext {
  ownership: { projectId: string; userId: string };
  memoryHint: string | null;
}

/**
 * Shared validation step for every Studio action: confirm auth + that
 * the user owns the project, then load + format the memory hint. Tools
 * that ignore the hint (voice) just don't pass it through.
 */
async function loadOwnedProjectContext(
  projectId: string,
): Promise<OwnedProjectContext | { error: string }> {
  if (!projectId) return { error: "Missing project id" };

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

  return {
    ownership: { projectId, userId: user.id },
    memoryHint,
  };
}

export interface GenerateImageActionResult {
  imageId?: string;
  error?: string;
}

export async function generateImage(
  formData: FormData,
): Promise<GenerateImageActionResult> {
  const projectId = (formData.get("project_id") as string) ?? "";
  const prompt = ((formData.get("prompt") as string) ?? "").trim();

  if (prompt.length === 0) return { error: "Prompt is required" };
  if (prompt.length > MAX_IMAGE_PROMPT_LENGTH) {
    return {
      error: `Prompt must be ${MAX_IMAGE_PROMPT_LENGTH} characters or fewer`,
    };
  }

  const ctx = await loadOwnedProjectContext(projectId);
  if ("error" in ctx) return { error: ctx.error };

  const supabase = await createClient();
  const userKey = await getUserApiKey(supabase, "replicate");
  const result = await generateImageForProject(
    supabase,
    ctx.ownership.userId,
    projectId,
    prompt,
    ctx.memoryHint,
    userKey,
  );

  if (result.error) return { error: result.error };

  revalidatePath(`/projects/${projectId}`);
  return { imageId: result.imageId };
}

export interface GenerateTextDraftActionResult {
  outputId?: string;
  error?: string;
}

export async function generateTextDraft(
  formData: FormData,
): Promise<GenerateTextDraftActionResult> {
  const projectId = (formData.get("project_id") as string) ?? "";
  const prompt = ((formData.get("prompt") as string) ?? "").trim();
  const rawKind = (formData.get("kind_hint") as string) ?? "general";
  const kindHint: TextDraftKind = VALID_TEXT_KINDS.has(rawKind as TextDraftKind)
    ? (rawKind as TextDraftKind)
    : "general";

  if (prompt.length === 0) return { error: "Prompt is required" };
  if (prompt.length > MAX_TEXT_PROMPT_LENGTH) {
    return {
      error: `Prompt must be ${MAX_TEXT_PROMPT_LENGTH} characters or fewer`,
    };
  }

  const ctx = await loadOwnedProjectContext(projectId);
  if ("error" in ctx) return { error: ctx.error };

  const supabase = await createClient();
  const userKey = await getUserApiKey(supabase, "anthropic");
  const result = await generateTextDraftForProject(
    supabase,
    ctx.ownership.userId,
    projectId,
    prompt,
    kindHint,
    ctx.memoryHint,
    userKey,
  );

  if (result.error) return { error: result.error };

  revalidatePath(`/projects/${projectId}`);
  return { outputId: result.outputId };
}

export interface GenerateVoiceOverActionResult {
  outputId?: string;
  charCount?: number;
  error?: string;
}

export async function generateVoiceOver(
  formData: FormData,
): Promise<GenerateVoiceOverActionResult> {
  const projectId = (formData.get("project_id") as string) ?? "";
  const script = ((formData.get("script") as string) ?? "").trim();
  const voiceId =
    ((formData.get("voice_id") as string) ?? "").trim() || undefined;

  if (script.length === 0) return { error: "Script is required" };
  if (script.length > MAX_VOICE_SCRIPT_LENGTH) {
    return {
      error: `Script must be ${MAX_VOICE_SCRIPT_LENGTH} characters or fewer (~30s clip cap)`,
    };
  }

  const ctx = await loadOwnedProjectContext(projectId);
  if ("error" in ctx) return { error: ctx.error };

  const supabase = await createClient();
  const userKey = await getUserApiKey(supabase, "elevenlabs");
  const result = await generateVoiceOverForProject(
    supabase,
    ctx.ownership.userId,
    projectId,
    script,
    voiceId,
    ctx.memoryHint,
    userKey,
  );

  if (result.error) return { error: result.error };

  revalidatePath(`/projects/${projectId}`);
  return { outputId: result.outputId, charCount: result.charCount };
}

/**
 * Delete a Studio output of any kind. For image/audio outputs we also
 * remove the Storage object; text outputs have no Storage file. RLS
 * guards on both the row and the Storage bucket.
 */
export async function deleteOutput(formData: FormData) {
  const outputId = (formData.get("id") as string) ?? "";
  const projectId = (formData.get("project_id") as string) ?? "";
  if (!outputId || !projectId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: row } = await supabase
    .from("studio_outputs")
    .select("id, kind, storage_path, user_id")
    .eq("id", outputId)
    .maybeSingle();

  if (!row || row.user_id !== user.id) return;

  if (row.storage_path) {
    await supabase.storage.from(BUCKET).remove([row.storage_path]);
  }
  await supabase
    .from("studio_outputs")
    .delete()
    .eq("id", outputId)
    .eq("user_id", user.id);

  revalidatePath(`/projects/${projectId}`);
}

/**
 * Backwards-compat alias. Old call sites import `deleteImage`; until
 * they migrate, we expose this name pointing at the same handler.
 * Drop after Phase 2 ships and all consumers reference deleteOutput.
 */
export const deleteImage = deleteOutput;

/**
 * Toggle the is_public flag on a studio output. Owner-only via RLS.
 * Used by the "Add to portfolio" / "Make private" button on each
 * output tile in the user's gallery.
 */
export async function togglePublicOutput(formData: FormData) {
  const outputId = (formData.get("id") as string) ?? "";
  const projectId = (formData.get("project_id") as string) ?? "";
  const currentlyPublic =
    (formData.get("currently_public") as string) === "true";
  if (!outputId || !projectId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("studio_outputs")
    .update({ is_public: !currentlyPublic })
    .eq("id", outputId)
    .eq("user_id", user.id);

  revalidatePath(`/projects/${projectId}`);
}

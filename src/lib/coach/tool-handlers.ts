import type { SupabaseClient } from "@supabase/supabase-js";
import { generateImageForProject } from "@/lib/studio/generate-image";
import { buildStudioMemoryHint } from "@/lib/coach/build-memory";
import type { ProjectFact, UserFact } from "@/types/coach";

const BUCKET = "studio-images";

export interface StudioImageHandlerSuccess {
  image_id: string;
  signed_url: string;
  prompt: string;
}

export type StudioImageHandlerResult =
  | StudioImageHandlerSuccess
  | { error: string };

/**
 * Server-side handler for the studio_image_generate tool. Loads memory
 * facts (so the image respects what's remembered about this project +
 * user), invokes generateImageForProject, then builds a fresh signed
 * URL the client can render in the chat bubble without a roundtrip.
 */
export async function handleStudioImage(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  input: { prompt: unknown },
): Promise<StudioImageHandlerResult> {
  const prompt =
    typeof input.prompt === "string" ? input.prompt.trim() : "";
  if (prompt.length === 0) {
    return { error: "Tool was called without a prompt" };
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
      .eq("user_id", userId)
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
    userId,
    projectId,
    prompt,
    memoryHint,
  );

  if (result.error || !result.imageId || !result.storagePath) {
    return { error: result.error ?? "Image generation failed" };
  }

  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(result.storagePath, 60 * 60);

  return {
    image_id: result.imageId,
    signed_url: signed?.signedUrl ?? "",
    prompt,
  };
}

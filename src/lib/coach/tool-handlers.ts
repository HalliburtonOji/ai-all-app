import type { SupabaseClient } from "@supabase/supabase-js";
import { generateImageForProject } from "@/lib/studio/generate-image";
import {
  generateTextDraftForProject,
  type TextDraftKind,
} from "@/lib/studio/generate-text";
import { generateVoiceOverForProject } from "@/lib/studio/generate-voice";
import { buildStudioMemoryHint } from "@/lib/coach/build-memory";
import type { ProjectFact, UserFact } from "@/types/coach";

const BUCKET = "studio-images";

/**
 * The "result" sent back via the SSE tool_result event. Always carries
 * `output_id` so the client can hydrate a `studio_output` linkage on
 * the persisted message; `kind` tells the bubble renderer how to
 * render. Binary outputs (image/audio) include a fresh signed_url;
 * text outputs include content_text.
 */
export type StudioToolHandlerSuccess =
  | {
      kind: "image";
      output_id: string;
      signed_url: string;
      prompt: string;
    }
  | {
      kind: "text";
      output_id: string;
      content_text: string;
      prompt: string;
    }
  | {
      kind: "audio";
      output_id: string;
      signed_url: string;
      prompt: string;
    };

export type StudioToolHandlerResult =
  | StudioToolHandlerSuccess
  | { error: string };

async function loadMemoryHint(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
): Promise<string | null> {
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
  return buildStudioMemoryHint(
    (pfRows ?? []) as ProjectFact[],
    (ufRows ?? []) as UserFact[],
  );
}

/**
 * Handler for the studio_image_generate tool. Same memory-aware flow
 * as the standalone Studio image action.
 */
export async function handleStudioImage(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  input: { prompt: unknown },
): Promise<StudioToolHandlerResult> {
  const prompt =
    typeof input.prompt === "string" ? input.prompt.trim() : "";
  if (prompt.length === 0) {
    return { error: "Tool was called without a prompt" };
  }

  const memoryHint = await loadMemoryHint(supabase, userId, projectId);
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
    kind: "image",
    output_id: result.imageId,
    signed_url: signed?.signedUrl ?? "",
    prompt,
  };
}

/**
 * Handler for the studio_text_draft tool. Same memory-aware flow,
 * Anthropic-only (no Storage).
 */
export async function handleStudioTextDraft(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  input: { prompt: unknown; kind: unknown },
): Promise<StudioToolHandlerResult> {
  const prompt =
    typeof input.prompt === "string" ? input.prompt.trim() : "";
  if (prompt.length === 0) {
    return { error: "Tool was called without a prompt" };
  }
  const VALID_KINDS: ReadonlySet<TextDraftKind> = new Set([
    "email",
    "social_post",
    "caption",
    "general",
  ]);
  const kind: TextDraftKind =
    typeof input.kind === "string" &&
    VALID_KINDS.has(input.kind as TextDraftKind)
      ? (input.kind as TextDraftKind)
      : "general";

  const memoryHint = await loadMemoryHint(supabase, userId, projectId);
  const result = await generateTextDraftForProject(
    supabase,
    userId,
    projectId,
    prompt,
    kind,
    memoryHint,
  );

  if (result.error || !result.outputId || !result.contentText) {
    return { error: result.error ?? "Text draft failed" };
  }

  return {
    kind: "text",
    output_id: result.outputId,
    content_text: result.contentText,
    prompt,
  };
}

/**
 * Handler for the studio_voice_generate tool. Same memory-aware flow
 * (hint logged in metadata, not spoken). 500-char cap enforced inside
 * the helper.
 */
export async function handleStudioVoiceOver(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  input: { script: unknown; voice_id?: unknown },
): Promise<StudioToolHandlerResult> {
  const script =
    typeof input.script === "string" ? input.script.trim() : "";
  if (script.length === 0) {
    return { error: "Tool was called without a script" };
  }
  const voiceId =
    typeof input.voice_id === "string" && input.voice_id.length > 0
      ? input.voice_id
      : undefined;

  const memoryHint = await loadMemoryHint(supabase, userId, projectId);
  const result = await generateVoiceOverForProject(
    supabase,
    userId,
    projectId,
    script,
    voiceId,
    memoryHint,
  );

  if (result.error || !result.outputId || !result.storagePath) {
    return { error: result.error ?? "Voice-over failed" };
  }

  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(result.storagePath, 60 * 60);

  return {
    kind: "audio",
    output_id: result.outputId,
    signed_url: signed?.signedUrl ?? "",
    prompt: script,
  };
}

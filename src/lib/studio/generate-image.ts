import Replicate from "replicate";
import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const BUCKET = "studio-images";
const MODEL = "black-forest-labs/flux-schnell";
const MAX_PROMPT_LENGTH = 1000;

// Smallest valid PNG (67 bytes): 1x1 fully transparent. Used in
// E2E_TEST_MODE so tests exercise the real Storage upload + signed URL
// fetch path without ever calling Replicate.
const MOCK_PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
  0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

export interface GenerateImageResult {
  imageId?: string;
  storagePath?: string;
  error?: string;
  skippedReason?: string;
}

/**
 * Generate an image for a Project. Caller validates auth + ownership;
 * this helper handles the Replicate call, the PNG upload to Supabase
 * Storage, and the studio_images row insert.
 *
 * `memoryHint` (optional) is a compact string of remembered project /
 * user context (built via `buildStudioMemoryHint`). When present it's
 * appended to the user's prompt as "Project context: …" before being
 * sent to FLUX, so generated images respect remembered facts about
 * audience / style / project intent.
 *
 * In E2E_TEST_MODE this skips Replicate but still exercises Storage +
 * DB so tests are deterministic and free. Test-mode `model` field
 * flips to "mock-with-context" when a hint was applied, so tests can
 * assert memory injection happened end-to-end.
 *
 * Special test-only failure path: when E2E_TEST_MODE and `prompt`
 * contains "__fail__", returns an error immediately without any DB
 * write — used to test the tool-failure UX.
 */
export async function generateImageForProject(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  prompt: string,
  memoryHint?: string | null,
): Promise<GenerateImageResult> {
  const trimmed = prompt.trim();
  if (trimmed.length === 0) {
    return { error: "Prompt is empty" };
  }
  if (trimmed.length > MAX_PROMPT_LENGTH) {
    return { error: `Prompt exceeds ${MAX_PROMPT_LENGTH} characters` };
  }

  if (
    process.env.E2E_TEST_MODE === "true" &&
    trimmed.includes("__fail__")
  ) {
    return { error: "Forced test failure" };
  }

  const hint = memoryHint?.trim() || null;
  const finalPrompt = hint
    ? `${trimmed}. Project context: ${hint}`
    : trimmed;

  const imageId = randomUUID();
  const storagePath = `${userId}/${projectId}/${imageId}.png`;

  let pngBytes: Uint8Array;
  let modelLabel = "flux-schnell";

  if (process.env.E2E_TEST_MODE === "true") {
    pngBytes = MOCK_PNG;
    modelLabel = hint ? "mock-with-context" : "mock";
  } else {
    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) {
      return { error: "REPLICATE_API_TOKEN not configured on server" };
    }

    try {
      const replicate = new Replicate({ auth: apiToken });
      const output = (await replicate.run(MODEL, {
        input: {
          prompt: finalPrompt,
          aspect_ratio: "1:1",
          output_format: "png",
          num_outputs: 1,
          num_inference_steps: 4,
        },
      })) as unknown;

      const url = extractFirstUrl(output);
      if (!url) {
        return { error: "Replicate returned no image URL" };
      }

      const imgResponse = await fetch(url);
      if (!imgResponse.ok) {
        return { error: `Failed to fetch generated image (${imgResponse.status})` };
      }
      const arrayBuffer = await imgResponse.arrayBuffer();
      pngBytes = new Uint8Array(arrayBuffer);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Replicate call failed";
      return { error: msg };
    }
  }

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, pngBytes, {
      contentType: "image/png",
      upsert: false,
    });

  if (uploadError) {
    return { error: `Storage upload failed: ${uploadError.message}` };
  }

  const { data: row, error: insertError } = await supabase
    .from("studio_images")
    .insert({
      id: imageId,
      project_id: projectId,
      user_id: userId,
      prompt: trimmed,
      storage_path: storagePath,
      model: modelLabel,
    })
    .select("id, storage_path")
    .maybeSingle();

  if (insertError || !row) {
    // Best-effort cleanup so we don't leave an orphan in Storage.
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return { error: insertError?.message ?? "Failed to record image" };
  }

  return { imageId: row.id, storagePath: row.storage_path };
}

function extractFirstUrl(output: unknown): string | null {
  if (typeof output === "string") return output;
  if (Array.isArray(output) && output.length > 0) {
    const first = output[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && "url" in first) {
      const url = (first as { url: unknown }).url;
      if (typeof url === "string") return url;
      if (typeof url === "function") {
        try {
          const result = (url as () => unknown)();
          if (typeof result === "string") return result;
          if (result instanceof URL) return result.toString();
        } catch {
          return null;
        }
      }
    }
  }
  if (output && typeof output === "object" && "url" in output) {
    const url = (output as { url: unknown }).url;
    if (typeof url === "string") return url;
  }
  return null;
}

import Replicate from "replicate";
import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const BUCKET = "studio-images";
const MAX_SOURCE_BYTES = 12 * 1024 * 1024;

export type ImageTransform = "upscale" | "remove_bg";

const REPLICATE_MODEL: Record<
  ImageTransform,
  `${string}/${string}` | `${string}/${string}:${string}`
> = {
  // Real-ESRGAN — well-known general-purpose upscaler. ~$0.001/image
  // typical, returns a PNG URL.
  upscale:
    "nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa",
  // rembg — clean alpha-channel background removal.
  remove_bg:
    "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
};

const TRANSFORM_LABEL: Record<ImageTransform, string> = {
  upscale: "Upscale (4×)",
  remove_bg: "Remove background",
};

// Same 67-byte transparent PNG used elsewhere in the codebase.
const MOCK_PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
  0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

export interface TransformImageResult {
  outputId?: string;
  storagePath?: string;
  error?: string;
}

/**
 * Run an image-to-image transform (upscale or background-remove) on a
 * source image the client uploaded to Storage. We require the source
 * path to start with `${userId}/${projectId}/` so the path-prefix RLS
 * keeps things owner-scoped even if the request body is fudged.
 *
 * Mock mode skips Replicate and just persists the same MOCK_PNG so
 * tests stay free + deterministic. The source upload is cleaned up
 * either way.
 */
export async function transformImageForProject(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  sourcePath: string,
  transform: ImageTransform,
  originalFilename: string,
  apiKeyOverride?: string | null,
): Promise<TransformImageResult> {
  if (!sourcePath.startsWith(`${userId}/${projectId}/`)) {
    return { error: "Source path does not belong to this project" };
  }

  const outputId = randomUUID();
  const outputStoragePath = `${userId}/${projectId}/${outputId}.png`;
  let resultBytes: Uint8Array;
  let modelLabel: string;

  if (process.env.E2E_TEST_MODE === "true") {
    resultBytes = MOCK_PNG;
    modelLabel =
      transform === "upscale" ? "mock-upscale" : "mock-remove-bg";
  } else {
    const apiKey = apiKeyOverride ?? process.env.REPLICATE_API_TOKEN;
    if (!apiKey) {
      return { error: "REPLICATE_API_TOKEN not configured on server" };
    }

    // Need a publicly reachable URL for Replicate to fetch the
    // source. Storage signed URLs work; 60s TTL.
    const { data: signed, error: signErr } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(sourcePath, 60);
    if (signErr || !signed) {
      return {
        error: `Could not sign source URL: ${signErr?.message ?? "unknown"}`,
      };
    }

    try {
      const replicate = new Replicate({ auth: apiKey });
      const input =
        transform === "upscale"
          ? { image: signed.signedUrl, scale: 4 }
          : { image: signed.signedUrl };
      const output = await replicate.run(REPLICATE_MODEL[transform], {
        input,
      });
      const url = normalizeReplicateOutput(output);
      if (!url) {
        return { error: "Replicate returned no result URL" };
      }
      const resp = await fetch(url);
      if (!resp.ok) {
        return { error: `Result download failed (${resp.status})` };
      }
      resultBytes = new Uint8Array(await resp.arrayBuffer());
      if (resultBytes.byteLength > MAX_SOURCE_BYTES * 2) {
        return { error: "Result image too large to store" };
      }
      modelLabel = apiKeyOverride
        ? `${transform}-replicate-byok`
        : `${transform}-replicate`;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Replicate call failed";
      return { error: msg };
    }
  }

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(outputStoragePath, resultBytes, {
      contentType: "image/png",
      upsert: false,
    });
  if (uploadError) {
    return { error: `Storage upload failed: ${uploadError.message}` };
  }

  const promptLabel = `${TRANSFORM_LABEL[transform]} of ${originalFilename}`.slice(
    0,
    200,
  );
  const { data: row, error: insertError } = await supabase
    .from("studio_outputs")
    .insert({
      id: outputId,
      project_id: projectId,
      user_id: userId,
      kind: "image",
      prompt: promptLabel,
      content_text: null,
      storage_path: outputStoragePath,
      model: modelLabel,
      metadata: {
        source: "transform",
        transform,
        original_filename: originalFilename,
      },
    })
    .select("id, storage_path")
    .maybeSingle();

  if (insertError || !row) {
    await supabase.storage.from(BUCKET).remove([outputStoragePath]);
    return { error: insertError?.message ?? "Failed to record transform" };
  }

  // Drop the source upload — we keep the transform output, not the
  // raw input. Best-effort.
  await supabase.storage.from(BUCKET).remove([sourcePath]);

  return { outputId: row.id, storagePath: row.storage_path };
}

function normalizeReplicateOutput(output: unknown): string | null {
  if (typeof output === "string") return output;
  if (Array.isArray(output) && output.length > 0) {
    const first = output[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && "url" in first) {
      const u = (first as { url: unknown }).url;
      return typeof u === "function" ? String((u as () => unknown)()) : String(u);
    }
  }
  if (output && typeof output === "object" && "url" in output) {
    const u = (output as { url: unknown }).url;
    return typeof u === "function" ? String((u as () => unknown)()) : String(u);
  }
  return null;
}

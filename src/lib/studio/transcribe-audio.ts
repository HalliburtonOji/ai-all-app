import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const BUCKET = "studio-images";
const MODEL = "whisper-1";
const OPENAI_TRANSCRIBE_URL = "https://api.openai.com/v1/audio/transcriptions";
const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // Whisper's hard upload cap.
const MAX_TRANSCRIPT_LENGTH = 20_000;

export interface TranscribeResult {
  outputId?: string;
  text?: string;
  error?: string;
}

/**
 * Transcribe a previously-uploaded audio file. The file lives in
 * Storage at `audioStoragePath` (path-prefix RLS verifies the
 * authenticated user owns it). We download it, hand it to Whisper,
 * persist the transcript as a `studio_outputs` row of kind=text, and
 * delete the source audio (we don't need to keep raw uploads — the
 * transcript is the durable artifact).
 *
 * Mock mode skips Whisper + Storage download and emits a deterministic
 * `[mock-transcript]` so tests are free + stable. The source audio is
 * still deleted so the test exercises that path.
 */
export async function transcribeAudioForProject(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  audioStoragePath: string,
  originalFilename: string,
  apiKeyOverride?: string | null,
): Promise<TranscribeResult> {
  if (!audioStoragePath || !audioStoragePath.startsWith(`${userId}/${projectId}/`)) {
    return { error: "Audio path does not belong to this project" };
  }

  let transcript = "";
  let modelLabel: string;

  if (process.env.E2E_TEST_MODE === "true") {
    transcript = `[mock-transcript] Filename: ${originalFilename}. Path: ${audioStoragePath}.`;
    modelLabel = "mock-transcript";
  } else {
    const apiKey = apiKeyOverride ?? process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { error: "OPENAI_API_KEY not configured on server" };
    }

    // Pull the bytes back from Storage. The server-side Supabase client
    // is RLS-scoped to this user, so this download enforces ownership.
    const { data: blob, error: dlError } = await supabase.storage
      .from(BUCKET)
      .download(audioStoragePath);
    if (dlError || !blob) {
      return {
        error: `Could not read uploaded audio: ${dlError?.message ?? "unknown"}`,
      };
    }
    const audioBytes = new Uint8Array(await blob.arrayBuffer());
    if (audioBytes.byteLength > MAX_AUDIO_BYTES) {
      await supabase.storage.from(BUCKET).remove([audioStoragePath]);
      return { error: "Audio file exceeds 25 MB Whisper limit." };
    }

    try {
      const form = new FormData();
      // Wrap the bytes in a Blob; Whisper requires a filename so we
      // pass through whatever the user uploaded.
      form.append(
        "file",
        new Blob([audioBytes as BlobPart], {
          type: blob.type || "application/octet-stream",
        }),
        originalFilename || "audio.mp3",
      );
      form.append("model", MODEL);

      const resp = await fetch(OPENAI_TRANSCRIBE_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      });
      if (!resp.ok) {
        const errText = await resp.text().catch(() => "");
        return {
          error: `Whisper error (${resp.status}): ${errText.slice(0, 200)}`,
        };
      }
      const json = (await resp.json()) as { text?: string };
      transcript = (json.text ?? "").trim();
      modelLabel = apiKeyOverride ? `${MODEL}-byok` : MODEL;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Whisper call failed";
      return { error: msg };
    }
  }

  if (!transcript) {
    return { error: "Transcription returned no text." };
  }
  if (transcript.length > MAX_TRANSCRIPT_LENGTH) {
    transcript = transcript.slice(0, MAX_TRANSCRIPT_LENGTH);
  }

  const outputId = randomUUID();
  const { data: row, error: insertError } = await supabase
    .from("studio_outputs")
    .insert({
      id: outputId,
      project_id: projectId,
      user_id: userId,
      kind: "text",
      prompt: `Transcription of ${originalFilename}`.slice(0, 200),
      content_text: transcript,
      storage_path: null,
      model: modelLabel,
      metadata: {
        source: "transcription",
        original_filename: originalFilename,
        char_count: transcript.length,
      },
    })
    .select("id")
    .maybeSingle();

  if (insertError || !row) {
    return { error: insertError?.message ?? "Failed to save transcript" };
  }

  // Cleanup: drop the raw upload now that the transcript is saved.
  // Best-effort — a Storage cleanup failure shouldn't fail the user
  // request when we already have the transcript persisted.
  await supabase.storage.from(BUCKET).remove([audioStoragePath]);

  return { outputId: row.id, text: transcript };
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const BUCKET = "studio-images";
const MODEL = "eleven-flash-v2-5";
const ELEVEN_BASE_URL = "https://api.elevenlabs.io/v1";
const MAX_SCRIPT_LENGTH = 500;

// ElevenLabs free-tier voice presets. The default is Rachel — warm,
// neutral US English, included on every account. Adding additional
// voice IDs here makes them selectable via the UI dropdown without
// any backend change.
export const VOICE_PRESETS = [
  { id: "21m00Tcm4TlvDq8ikWAM", label: "Rachel (US, warm)" },
  { id: "AZnzlk1XvdvUeBnXmlld", label: "Domi (US, confident)" },
  { id: "EXAVITQu4vr4xnSDxMaL", label: "Bella (US, soft)" },
  { id: "ErXwobaYiN019PkySvjV", label: "Antoni (US, friendly)" },
  { id: "MF3mGyEYCl7XYWbV9V6O", label: "Elli (US, young)" },
  { id: "TxGEqnHWrfWFTfGW9XjX", label: "Josh (US, deep)" },
] as const;

export const DEFAULT_VOICE_ID = VOICE_PRESETS[0].id;

// Minimal MP3 byte sequence for E2E_TEST_MODE: a single MPEG-1 Layer 3
// frame header (32 kbps mono, 22.05 kHz) followed by zero padding to
// a valid frame length. Browsers decode this as ~50ms of silence.
// Used only in tests to exercise the Storage upload + signed URL path
// without paying ElevenLabs.
const MOCK_MP3 = (() => {
  const frame = new Uint8Array(105);
  frame[0] = 0xff;
  frame[1] = 0xfb;
  frame[2] = 0x10;
  frame[3] = 0xc4;
  // Remaining 101 bytes default to 0x00, which is silent audio data.
  return frame;
})();

export interface GenerateVoiceResult {
  outputId?: string;
  storagePath?: string;
  charCount?: number;
  error?: string;
}

/**
 * Generate a voice-over for a Project. Caller has validated auth +
 * project ownership.
 *
 * Hard 500-char cap on the script — at typical TTS speeds (~140 wpm,
 * ~12 chars/sec) this maps to ≤30 seconds of audio, keeping cost
 * predictable.
 *
 * In E2E_TEST_MODE this skips ElevenLabs and uploads a tiny mock MP3
 * so tests are free + deterministic. Test-only `__fail__` token in
 * the script forces a failure path.
 */
export async function generateVoiceOverForProject(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  script: string,
  voiceId: string = DEFAULT_VOICE_ID,
  memoryHint?: string | null,
  apiKeyOverride?: string | null,
): Promise<GenerateVoiceResult> {
  const trimmed = script.trim();
  if (trimmed.length === 0) {
    return { error: "Script is empty" };
  }
  if (trimmed.length > MAX_SCRIPT_LENGTH) {
    return {
      error: `Script exceeds ${MAX_SCRIPT_LENGTH} characters (~30s clip cap)`,
    };
  }
  if (
    !VOICE_PRESETS.some((v) => v.id === voiceId)
  ) {
    return { error: "Unknown voice id" };
  }

  if (
    process.env.E2E_TEST_MODE === "true" &&
    trimmed.includes("__fail__")
  ) {
    return { error: "Forced test failure" };
  }

  const hint = memoryHint?.trim() || null;
  const outputId = randomUUID();
  const storagePath = `${userId}/${projectId}/${outputId}.mp3`;

  let mp3Bytes: Uint8Array;
  let modelLabel: string;

  if (process.env.E2E_TEST_MODE === "true") {
    mp3Bytes = MOCK_MP3;
    modelLabel = hint ? "mock-audio-with-context" : "mock-audio";
  } else {
    const apiKey = apiKeyOverride ?? process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return { error: "ELEVENLABS_API_KEY not configured on server" };
    }

    try {
      const resp = await fetch(
        `${ELEVEN_BASE_URL}/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text: trimmed,
            model_id: "eleven_flash_v2_5",
          }),
        },
      );
      if (!resp.ok) {
        const errText = await resp.text().catch(() => "");
        return {
          error: `ElevenLabs error (${resp.status}): ${errText.slice(0, 200)}`,
        };
      }
      const arrayBuffer = await resp.arrayBuffer();
      mp3Bytes = new Uint8Array(arrayBuffer);
      modelLabel = apiKeyOverride ? `${MODEL}-byok` : MODEL;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "ElevenLabs call failed";
      return { error: msg };
    }
  }

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, mp3Bytes, {
      contentType: "audio/mpeg",
      upsert: false,
    });
  if (uploadError) {
    return { error: `Storage upload failed: ${uploadError.message}` };
  }

  const { data: row, error: insertError } = await supabase
    .from("studio_outputs")
    .insert({
      id: outputId,
      project_id: projectId,
      user_id: userId,
      kind: "audio",
      prompt: trimmed.slice(0, 200), // The prompt column is the same script (truncated for indexing)
      content_text: trimmed, // Full script lives here for the gallery to display
      storage_path: storagePath,
      model: modelLabel,
      metadata: {
        voice_id: voiceId,
        char_count: trimmed.length,
        output_format: "mp3_44100_128",
        memory_hint_applied: hint !== null,
      },
    })
    .select("id, storage_path")
    .maybeSingle();

  if (insertError || !row) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return { error: insertError?.message ?? "Failed to record voice-over" };
  }

  return {
    outputId: row.id,
    storagePath: row.storage_path,
    charCount: trimmed.length,
  };
}

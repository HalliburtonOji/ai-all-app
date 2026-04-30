/**
 * The unified Studio output shape. Covers every persisted output
 * regardless of which Studio tool produced it.
 *
 * Field semantics by `kind`:
 *   - "image": storage_path + signed_url required, content_text null
 *   - "text":  content_text required, storage_path + signed_url null
 *   - "audio": storage_path + signed_url required (mp3 file),
 *              content_text holds the script that was spoken
 */
export type StudioOutputKind = "image" | "text" | "audio";

export interface StudioOutput {
  id: string;
  project_id: string;
  user_id?: string;
  kind: StudioOutputKind;
  prompt: string;
  /**
   * For "text": the generated copy/email/caption text.
   * For "audio": the script that was spoken (so the gallery shows what
   *   was said without playing the clip).
   * For "image": null.
   */
  content_text?: string | null;
  /**
   * For binary outputs ("image" | "audio"): the path inside the
   * `studio-images` Storage bucket (path convention unchanged from
   * Phase 1: `${user_id}/${project_id}/${output_id}.{png|mp3}`).
   * For "text": null.
   */
  storage_path?: string | null;
  /**
   * Hydrated server-side at page-load time for binary outputs. 1-hour
   * TTL signed URL.
   */
  signed_url?: string | null;
  /**
   * The model that produced this output. Examples:
   *   "flux-schnell", "claude-sonnet-4-6", "eleven-flash-v2-5"
   *   "mock", "mock-with-context", "mock-text", "mock-audio"
   */
  model: string;
  /**
   * Per-tool extras: e.g. { voice_id, output_format, char_count,
   * duration_ms, kind_hint }. Optional — many outputs don't need it.
   */
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

/**
 * Backwards-compat alias for code paths that haven't yet been
 * generalised. Drop after Phase 2 ships and all consumers reference
 * StudioOutput directly.
 */
export type StudioImage = StudioOutput;

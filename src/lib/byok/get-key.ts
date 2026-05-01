import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptString } from "./crypto";

export type ProviderId =
  | "anthropic"
  | "replicate"
  | "elevenlabs"
  | "openai";

/**
 * Look up the current user's stored key for a given provider.
 * Returns the decrypted key, or null if the user hasn't set one.
 *
 * Caller is expected to be using an SSR client whose RLS context is
 * the calling user (so the SELECT respects ownership). Don't call
 * this with a service-role client and an arbitrary userId — pass the
 * SSR client and let RLS gate it.
 */
export async function getUserApiKey(
  supabase: SupabaseClient,
  provider: ProviderId,
): Promise<string | null> {
  const { data } = await supabase
    .from("user_api_keys")
    .select("ciphertext, iv, auth_tag")
    .eq("provider", provider)
    .maybeSingle();
  if (!data) return null;
  try {
    return decryptString({
      ciphertext: data.ciphertext as string,
      iv: data.iv as string,
      authTag: data.auth_tag as string,
    });
  } catch (err) {
    // If decryption fails (e.g. service-role key was rotated), fall
    // back to "no user key" — the caller will use the platform key,
    // and the user will hit a "your key looks broken — re-paste it"
    // moment in the UI on their next visit to /me/keys.
    console.error(
      `[byok] decrypt failed for provider=${provider}, falling back to env`,
      err,
    );
    return null;
  }
}

/**
 * Return the user's key if present, else fall back to the platform
 * env var. Returns `{ key, source }` so callers can log/expose the
 * source for observability or the mock-mode marker pattern.
 */
export async function getEffectiveKey(
  supabase: SupabaseClient,
  provider: ProviderId,
  envFallback: string | undefined,
): Promise<{ key: string | null; source: "user" | "platform" | null }> {
  const userKey = await getUserApiKey(supabase, provider);
  if (userKey) return { key: userKey, source: "user" };
  if (envFallback) return { key: envFallback, source: "platform" };
  return { key: null, source: null };
}

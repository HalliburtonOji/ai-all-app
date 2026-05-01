"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { encryptString } from "@/lib/byok/crypto";
import type { ProviderId } from "@/lib/byok/get-key";

const ALLOWED_PROVIDERS: ReadonlySet<string> = new Set([
  "anthropic",
  "replicate",
  "elevenlabs",
  "openai",
]);

const MAX_KEY_LENGTH = 500;
const MAX_LABEL_LENGTH = 100;

export interface SaveKeyResult {
  ok?: true;
  error?: string;
}

/**
 * Save (or replace) the user's API key for a provider. Encrypts the
 * plaintext server-side before storing. Idempotent — calling twice
 * with different keys updates in place via the (user_id, provider)
 * unique constraint.
 */
export async function saveUserApiKey(
  formData: FormData,
): Promise<SaveKeyResult> {
  const provider = ((formData.get("provider") as string) ?? "").trim();
  const key = ((formData.get("api_key") as string) ?? "").trim();
  const label = ((formData.get("label") as string) ?? "").trim();

  if (!ALLOWED_PROVIDERS.has(provider)) {
    return { error: "Unsupported provider" };
  }
  if (!key) return { error: "Paste a key" };
  if (key.length > MAX_KEY_LENGTH) {
    return { error: `Key looks too long (max ${MAX_KEY_LENGTH} chars)` };
  }
  if (label.length > MAX_LABEL_LENGTH) {
    return { error: `Label too long (max ${MAX_LABEL_LENGTH} chars)` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  let encrypted;
  try {
    encrypted = encryptString(key);
  } catch (err) {
    console.error("[byok] encrypt failed:", err);
    return { error: "Server can't encrypt right now — try again." };
  }

  // Upsert against (user_id, provider) so a save replaces an existing
  // key without leaving an orphan. The unique constraint enforces it.
  const { error: upsertErr } = await supabase
    .from("user_api_keys")
    .upsert(
      {
        user_id: user.id,
        provider: provider as ProviderId,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        auth_tag: encrypted.authTag,
        label: label || null,
      },
      { onConflict: "user_id,provider" },
    );

  if (upsertErr) {
    console.error("[byok] upsert failed:", upsertErr);
    return { error: "Could not save key — try again." };
  }

  revalidatePath("/me/keys");
  return { ok: true };
}

export async function deleteUserApiKey(formData: FormData) {
  const provider = ((formData.get("provider") as string) ?? "").trim();
  if (!ALLOWED_PROVIDERS.has(provider)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("user_api_keys")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", provider);

  revalidatePath("/me/keys");
}

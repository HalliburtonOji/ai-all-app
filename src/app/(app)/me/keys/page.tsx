import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { decryptString, redactKey } from "@/lib/byok/crypto";
import { ProviderKeyCard } from "./ProviderKeyCard";

const PROVIDERS = [
  {
    id: "anthropic",
    label: "Anthropic (Claude)",
    blurb:
      "Powers the Coach, the lesson Tutor, the suggestions tray, and the copy/email drafter.",
    signupUrl: "https://console.anthropic.com/settings/keys",
    signupLabel: "Get a key →",
  },
  {
    id: "replicate",
    label: "Replicate",
    blurb: "Powers Studio image generation (FLUX schnell).",
    signupUrl: "https://replicate.com/account/api-tokens",
    signupLabel: "Get a token →",
  },
  {
    id: "elevenlabs",
    label: "ElevenLabs",
    blurb: "Powers Studio voice-overs (Flash v2.5).",
    signupUrl: "https://elevenlabs.io/app/settings/api-keys",
    signupLabel: "Get a key →",
  },
] as const;

export default async function KeysPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("user_api_keys")
    .select("provider, ciphertext, iv, auth_tag, label");

  // Decrypt → redact server-side. The plaintext never reaches the
  // client; the card only sees the redacted form (e.g. "sk-…1234").
  const byProvider: Record<
    string,
    { redacted: string; label: string | null }
  > = {};
  for (const row of (rows ?? []) as Array<{
    provider: string;
    ciphertext: string;
    iv: string;
    auth_tag: string;
    label: string | null;
  }>) {
    try {
      const plaintext = decryptString({
        ciphertext: row.ciphertext,
        iv: row.iv,
        authTag: row.auth_tag,
      });
      byProvider[row.provider] = {
        redacted: redactKey(plaintext),
        label: row.label,
      };
    } catch {
      byProvider[row.provider] = {
        redacted: "(decryption failed — re-paste your key)",
        label: row.label,
      };
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Settings
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-black sm:text-4xl dark:text-white">
        Your API keys (BYOK)
      </h1>
      <p className="mt-2 max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
        Bring your own keys for the AI providers we wrap. When a key is set
        for a provider, the app uses it for your requests instead of the
        platform key — meaning you pay the provider directly, no usage caps
        from us, and no surprise bills for anyone.
      </p>
      <p className="mt-3 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
        Keys are encrypted at rest (AES-256-GCM) and only decrypted server-side
        when needed. We never log them, never send them to a third party, and
        never expose the plaintext back to your browser.
      </p>

      <div className="mt-8 space-y-4">
        {PROVIDERS.map((p) => {
          const stored = byProvider[p.id];
          return (
            <ProviderKeyCard
              key={p.id}
              provider={p}
              redacted={stored?.redacted ?? null}
              storedLabel={stored?.label ?? null}
            />
          );
        })}
      </div>

      <p className="mt-10 text-xs text-zinc-500 dark:text-zinc-500">
        <Link
          href="/dashboard"
          className="underline-offset-2 hover:underline"
        >
          ← Back to dashboard
        </Link>
      </p>
    </main>
  );
}

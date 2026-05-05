import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { decryptString, redactKey } from "@/lib/byok/crypto";
import { ProviderKeyCard } from "../keys/ProviderKeyCard";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getLocale } from "@/lib/i18n/get-locale";
import { LOCALE_LABELS } from "@/lib/i18n/locales";

const PROVIDERS = [
  {
    id: "anthropic" as const,
    label: "Anthropic (Claude)",
    blurb:
      "Powers the Coach, the lesson Tutor, the suggestions tray, and the copy/email drafter.",
    signupUrl: "https://console.anthropic.com/settings/keys",
    signupLabel: "Get a key →",
  },
  {
    id: "openai" as const,
    label: "OpenAI",
    blurb: "Powers Studio audio transcription (Whisper).",
    signupUrl: "https://platform.openai.com/api-keys",
    signupLabel: "Get a key →",
  },
  {
    id: "replicate" as const,
    label: "Replicate",
    blurb:
      "Powers Studio image generation (FLUX schnell), upscale, and background remover.",
    signupUrl: "https://replicate.com/account/api-tokens",
    signupLabel: "Get a token →",
  },
  {
    id: "elevenlabs" as const,
    label: "ElevenLabs",
    blurb: "Powers Studio voice-overs (Flash v2.5).",
    signupUrl: "https://elevenlabs.io/app/settings/api-keys",
    signupLabel: "Get a key →",
  },
];

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const locale = await getLocale();

  const { data: rows } = await supabase
    .from("user_api_keys")
    .select("provider, ciphertext, iv, auth_tag, label");

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

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--brand-strong)] shadow-sm">
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--brand)]"
        />
        Settings
      </div>
      <h1 className="mt-4 text-4xl font-semibold leading-[0.95] tracking-tight text-[var(--foreground)] sm:text-5xl">
        Your account
      </h1>
      <p className="mt-3 max-w-xl text-base text-zinc-700 dark:text-zinc-300">
        Account, language, and AI provider keys. All in one place.
      </p>

      {/* ACCOUNT ─────────────────────────────────────────────────── */}
      <section
        data-settings-section="account"
        className="mt-10 rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-6"
      >
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Account
        </h2>
        <dl className="mt-4 grid grid-cols-1 gap-y-3 sm:grid-cols-[140px_1fr] sm:gap-x-6 text-sm">
          <dt className="text-zinc-500">Email</dt>
          <dd className="break-all text-[var(--foreground)]">{user?.email}</dd>
          {memberSince && (
            <>
              <dt className="text-zinc-500">Member since</dt>
              <dd className="text-[var(--foreground)]">{memberSince}</dd>
            </>
          )}
          <dt className="text-zinc-500">Language</dt>
          <dd className="flex items-center gap-3 text-[var(--foreground)]">
            <span>{LOCALE_LABELS[locale]}</span>
            <span className="text-zinc-500">·</span>
            <LanguageSwitcher current={locale} />
          </dd>
        </dl>
      </section>

      {/* BYOK ────────────────────────────────────────────────────── */}
      <section
        data-settings-section="byok"
        className="mt-6"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
            API keys (BYOK)
          </h2>
          <Link
            href="/me/keys"
            className="text-xs text-zinc-500 underline-offset-2 hover:underline"
          >
            Old route still works →
          </Link>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-zinc-700 dark:text-zinc-300">
          When a key is set, the app uses it for your requests instead of the
          platform key — meaning you pay the provider directly, no caps from
          us. Keys are encrypted at rest (AES-256-GCM) and only decrypted
          server-side when needed.
        </p>

        <div className="mt-5 space-y-3">
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
      </section>

      <p className="mt-12 text-xs text-zinc-500 dark:text-zinc-500">
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

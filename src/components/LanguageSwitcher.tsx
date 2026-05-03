"use client";

import { useState } from "react";
import {
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  type Locale,
} from "@/lib/i18n/locales";

/**
 * Language switcher dropdown. POSTs to /api/locale which sets the
 * cookie via response headers and 303-redirects back. We avoid the
 * server-action + useTransition + revalidate path because under
 * Next.js 16 it raced and produced a "page couldn't load" error.
 */
export function LanguageSwitcher({ current }: { current: Locale }) {
  const [pending, setPending] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    if (next === current) return;
    setPending(true);
    const formData = new FormData();
    formData.set("locale", next);
    try {
      await fetch("/api/locale", {
        method: "POST",
        body: formData,
        // Important: follow the 303 to surface the redirect target
        // and let the browser pick up the cookie before reload.
        redirect: "follow",
      });
    } finally {
      // Full-page reload so every server-rendered surface picks up
      // the new locale cookie.
      window.location.reload();
    }
  }

  return (
    <label
      data-language-switcher="true"
      className="hidden items-center gap-1 text-xs sm:flex"
    >
      <span className="sr-only">Language</span>
      <select
        value={current}
        onChange={onChange}
        disabled={pending}
        data-language-switcher-select="true"
        className="rounded-md border border-[var(--border-soft)] bg-transparent px-2 py-1 text-xs text-[var(--foreground)] focus:border-[var(--brand)] focus:outline-none disabled:opacity-50"
      >
        {SUPPORTED_LOCALES.map((l) => (
          <option key={l} value={l}>
            {LOCALE_LABELS[l]}
          </option>
        ))}
      </select>
    </label>
  );
}

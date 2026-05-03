export type Locale = "en" | "fr" | "sw";

export const DEFAULT_LOCALE: Locale = "en";

export const SUPPORTED_LOCALES: Locale[] = ["en", "fr", "sw"];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  sw: "Kiswahili",
};

/** Cookie name used to persist the user's locale preference. */
export const LOCALE_COOKIE = "ai-all-app-locale";

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" &&
    (SUPPORTED_LOCALES as readonly string[]).includes(value)
  );
}

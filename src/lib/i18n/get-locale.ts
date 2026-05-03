import "server-only";
import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  type Locale,
} from "./locales";

/**
 * Read the user's preferred locale from the persistent cookie.
 * Falls back to DEFAULT_LOCALE when missing or invalid.
 *
 * Must be called from a Server Component, Server Action, or Route
 * Handler — `next/headers` is server-only.
 */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/**
 * Bound translator for a locale. Convenience for components that
 * resolve the locale once and then call `t("...")` many times.
 */
import { translate, type MessageKey } from "./messages";

export type Translator = (
  key: MessageKey,
  params?: Record<string, string | number>,
) => string;

export async function getTranslator(): Promise<{
  locale: Locale;
  t: Translator;
}> {
  const locale = await getLocale();
  return {
    locale,
    t: (key, params) => translate(locale, key, params),
  };
}

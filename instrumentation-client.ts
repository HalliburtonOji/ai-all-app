/**
 * Sentry client-side init. Loaded by Next.js automatically when the
 * browser bundle hydrates. No-op until NEXT_PUBLIC_SENTRY_DSN is set.
 *
 * The DSN MUST be NEXT_PUBLIC_-prefixed so it's exposed to the
 * browser bundle. (DSNs are not secrets — Sentry expects them in
 * client-side code.)
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Capture 10% of transactions; lighter than the default 100%.
    tracesSampleRate: 0.1,
    // Disable session replay by default — opt-in feature, requires
    // separate Sentry plan tier.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    debug: false,
    environment:
      process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  });
}

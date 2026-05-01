/**
 * Sentry server-side init. Loaded by `instrumentation.ts` when the
 * Next.js Node runtime starts. No-op until SENTRY_DSN is set in env
 * (Vercel: Settings → Environment Variables) — the build won't fail
 * without it.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Capture 10% of transactions for performance monitoring. Bumped
    // up from default sampleRate=1.0 for performance-cost reasons.
    tracesSampleRate: 0.1,
    // Don't dump verbose noise to logs in production.
    debug: false,
    // Sentry environment tag — useful when viewing the events feed.
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  });
}

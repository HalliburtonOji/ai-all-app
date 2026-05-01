/**
 * Sentry edge-runtime init. Loaded by `instrumentation.ts` when the
 * Next.js edge runtime starts (middleware + edge routes). No-op
 * until SENTRY_DSN is set.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    debug: false,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  });
}

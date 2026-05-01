/**
 * Next.js instrumentation hook. Loads Sentry's server / edge configs
 * at process startup based on which runtime is initializing.
 *
 * `onRequestError` is Next.js's request-level error handler hook;
 * forwarding to Sentry captures otherwise-unobserved errors from
 * server components + actions.
 */
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;

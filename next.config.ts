import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      },
    ],
  },
};

// Wrap with Sentry's build-time hook. Without SENTRY_AUTH_TOKEN the
// source-map upload step is silently skipped (build still succeeds);
// with it, releases get uploaded for stack-trace symbolication.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Quiet build output unless we're in CI where logs are useful.
  silent: !process.env.CI,
  // Don't widen the bundle size for source-map upload features users
  // don't have configured. These are off until Halli adds SENTRY_DSN
  // + SENTRY_AUTH_TOKEN to Vercel.
  widenClientFileUpload: false,
  disableLogger: true,
});

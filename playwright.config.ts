import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.BASE_URL ?? "http://localhost:3000";
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  // 1 retry both CI and local: cross-user RLS tests do extra signups
  // (the worker fixture covers the default page, but those tests need a
  // second fresh user). Under heavy parallel load Supabase occasionally
  // throttles a signup; one retry absorbs that without hand-holding.
  retries: 1,
  // Parallel workers locally (default = #CPUs); CI capped at 4 to keep
  // Supabase signup load predictable. The auth-fixture (tests/e2e/auth-fixture.ts)
  // signs up ONE user per worker (not per test), so worker-count is the
  // upper bound on signups regardless of test count.
  workers: isCI ? 4 : undefined,
  reporter: isCI ? [["html"], ["github"]] : "html",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // Always use the production build for tests — both CI and local. Dev
    // mode's on-demand route compilation adds 10–30s per first-touch,
    // which dominates a full-suite run. The production build is cached
    // incrementally in .next/, so subsequent runs are fast.
    //
    // If you have `npm run dev` already running on port 3000 (e.g. for
    // manual testing), Playwright reuses that server locally
    // (reuseExistingServer below) — no rebuild needed.
    command: "npm run build && npm run start",
    url: baseURL,
    reuseExistingServer: !isCI,
    // Cold first-time build can be slow on Windows + OneDrive (filesystem
    // sync overhead). Bump the timeout so a freshly-cloned repo doesn't
    // fail the first test run.
    timeout: 180_000,
    stdout: "ignore",
    stderr: "pipe",
    // Tells the app to use deterministic mock responses instead of calling
    // external APIs (Anthropic). Only set during test runs — never in
    // `npm run dev` (where you want a real coach for manual testing).
    env: {
      E2E_TEST_MODE: "true",
      // The build step needs the public Supabase env vars to run; mock-
      // mode flags handle the rest at runtime.
    },
  },
});

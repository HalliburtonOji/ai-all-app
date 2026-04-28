import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.BASE_URL ?? "http://localhost:3000";
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  // CI uses a single worker for stability — sequential signups avoid
  // hitting Supabase auth rate limits and reduce flakiness.
  workers: isCI ? 1 : undefined,
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
    // In CI we run against the production build (`npm run start`) so tests
    // exercise the same code Vercel deploys. Locally we use the dev server
    // for hot-reload speed.
    command: isCI ? "npm run start" : "npm run dev",
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
    // Tells the app to use deterministic mock responses instead of calling
    // external APIs (Anthropic). Only set during test runs — never in
    // `npm run dev` (where you want a real coach for manual testing).
    env: {
      E2E_TEST_MODE: "true",
    },
  },
});

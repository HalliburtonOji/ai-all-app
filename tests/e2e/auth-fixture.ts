import { test as base, chromium } from "@playwright/test";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { signUpNewUser } from "./helpers/auth";

const AUTH_DIR = path.resolve("playwright/.auth");

/**
 * Worker-scoped auth fixture. Signs up ONE fresh user per Playwright
 * worker (not per test) via the regular UI signup flow, saves the
 * resulting cookies to a worker-indexed storageState file, and
 * returns that path. All tests in the same worker inherit the auth
 * state. No more per-test signup → tests start ~1.5s faster each.
 *
 * Why per-worker (not shared-across-workers):
 *   Supabase's @supabase/ssr rotates refresh tokens. A single shared
 *   storageState file across parallel workers races on cookie
 *   refresh — when one worker refreshes, others' in-memory cookies
 *   become stale and middleware redirects them to /login. Per-worker
 *   isolation sidesteps this entirely: each worker has its own user,
 *   own cookies, no cross-worker sharing.
 *
 * How tests use it:
 *
 *   import { test, expect } from "./auth-fixture";
 *   test("my test", async ({ page }) => {
 *     await page.goto("/dashboard"); // already logged in
 *   });
 *
 * Tests that need a logged-OUT browser (signup/login flow tests,
 * "logged-out user redirected to login" tests) override locally:
 *
 *   test.use({ storageState: { cookies: [], origins: [] } });
 *
 * Tests that need a SECOND user (cross-user RLS checks) keep using
 * `browser.newContext({ storageState: { cookies: [], origins: [] } })`
 * + signUpNewUser inside the test. The default `page` is the worker's
 * pre-authenticated user A; the new context becomes user B.
 */
export const test = base.extend<
  Record<string, never>,
  { workerStorageState: string }
>({
  storageState: ({ workerStorageState }, use) => use(workerStorageState),

  workerStorageState: [
    async ({}, use, workerInfo) => {
      mkdirSync(AUTH_DIR, { recursive: true });
      const file = path.join(
        AUTH_DIR,
        `worker-${workerInfo.workerIndex}.json`,
      );

      if (!existsSync(file)) {
        const browser = await chromium.launch();
        const ctx = await browser.newContext({
          // Set baseURL so signUpNewUser's `goto('/signup')` resolves correctly
          baseURL:
            workerInfo.project.use.baseURL ??
            process.env.BASE_URL ??
            "http://localhost:3000",
        });
        const page = await ctx.newPage();
        try {
          await signUpNewUser(page);
          await ctx.storageState({ path: file });
        } finally {
          await ctx.close();
          await browser.close();
        }
      }

      await use(file);
    },
    { scope: "worker" },
  ],
});

export { expect } from "@playwright/test";

import { test as base } from "@playwright/test";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { signUpNewUser } from "./helpers/auth";

const AUTH_DIR = path.resolve("playwright/.auth");

/**
 * Worker-scoped auth fixture. Signs up ONE fresh user per Playwright
 * worker (not per test), saves the resulting cookies to a worker-
 * indexed storageState file, and overrides the default storageState
 * so all tests in the same worker inherit the auth state.
 *
 * Why per-worker (not shared across workers): Supabase's
 * @supabase/ssr rotates refresh tokens. A single storageState shared
 * across parallel workers races on cookie refresh. Per-worker
 * isolation = each worker has its own user, own cookies, no
 * cross-worker sharing.
 *
 * Tests that need a logged-OUT browser create a fresh request
 * context locally:
 *
 *   const ctx = await playwright.request.newContext({
 *     storageState: { cookies: [], origins: [] },
 *   });
 *
 * Tests that need a SECOND user (cross-user RLS) keep using
 * `browser.newContext()` + signUpNewUser inside the test. The default
 * `page` is the worker's user A; the new context becomes user B.
 *
 * This pattern follows Playwright's official "authenticate in a
 * worker fixture" recipe — see playwright.dev/docs/auth.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const test = base.extend<{}, { workerStorageState: string }>({
  storageState: ({ workerStorageState }, use) => use(workerStorageState),

  workerStorageState: [
    async ({ browser }, use) => {
      mkdirSync(AUTH_DIR, { recursive: true });
      const id = test.info().parallelIndex;
      const file = path.join(AUTH_DIR, `worker-${id}.json`);

      if (existsSync(file)) {
        await use(file);
        return;
      }

      const ctx = await browser.newContext({
        storageState: undefined,
        baseURL: process.env.BASE_URL ?? "http://localhost:3000",
      });
      const page = await ctx.newPage();
      try {
        await signUpNewUser(page);
        await ctx.storageState({ path: file });
      } finally {
        await ctx.close();
      }

      await use(file);
    },
    { scope: "worker" },
  ],
});

export { expect } from "@playwright/test";

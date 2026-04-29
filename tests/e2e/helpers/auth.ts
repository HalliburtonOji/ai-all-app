import { expect, type Page } from "@playwright/test";
import { randomBytes } from "crypto";

export interface TestUser {
  email: string;
  password: string;
}

/**
 * Generate a fresh test user with a unique email per call.
 * Format: test-<timestamp>-<random>@aiallapp.test
 * The .test TLD is reserved by IANA so these emails will never deliver mail.
 */
export function makeTestUser(): TestUser {
  const id = `${Date.now()}-${randomBytes(4).toString("hex")}`;
  return {
    email: `test-${id}@aiallapp.test`,
    password: "TestPassword123!",
  };
}

/**
 * Sign up a brand-new user via the UI, then log them in. After this returns,
 * the page is on /dashboard and the user is authenticated.
 *
 * Requires that "Confirm email" is OFF in Supabase auth settings.
 */
export async function signUpNewUser(
  page: Page,
  user?: TestUser,
): Promise<TestUser> {
  const u = user ?? makeTestUser();

  await page.goto("/signup");
  await page.locator('input[name="email"]').fill(u.email);
  await page.locator('input[name="password"]').fill(u.password);
  await page.getByRole("button", { name: "Sign up", exact: true }).click();

  // With email confirmation OFF (our test config), signup redirects straight
  // to /dashboard because the session is established immediately. With
  // confirmation ON, signup redirects to /login with a message and we log in
  // manually. Wait for whichever lands and branch.
  await page.waitForURL(/\/(dashboard|login)/);

  if (page.url().includes("/dashboard")) {
    await expect(
      page.getByRole("heading", { name: /welcome/i }),
    ).toBeVisible();
    return u;
  }

  await loginAs(page, u.email, u.password);
  return u;
}

/**
 * Log in an existing user via the UI. After this returns, page is on /dashboard.
 */
export async function loginAs(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.waitForURL(/\/dashboard/);
  await expect(
    page.getByRole("heading", { name: /welcome/i }),
  ).toBeVisible();
}

/**
 * Log out the current user via the navbar. After this returns, page is on /login.
 */
export async function logout(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Log out" }).click();
  await page.waitForURL(/\/login/);
}

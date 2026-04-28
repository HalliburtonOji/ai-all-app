import { test, expect } from "@playwright/test";
import {
  loginAs,
  logout,
  makeTestUser,
  signUpNewUser,
} from "./helpers";

test.describe("Authentication", () => {
  test("a new user can sign up with email and password", async ({ page }) => {
    const user = makeTestUser();
    await signUpNewUser(page, user);

    // After signup + login, we should be on /dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    // The dashboard heading greets the user by email
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      user.email,
    );
  });

  test("a logged-out visitor to /dashboard is redirected to /login", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });

  test("a logged-out visitor to /projects is redirected to /login", async ({
    page,
  }) => {
    await page.goto("/projects");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });

  test("wrong password shows an error and does not log the user in", async ({
    page,
  }) => {
    // Create a real user first
    const user = makeTestUser();
    await signUpNewUser(page, user);
    // Log out so we have a clean slate to attempt the wrong password
    await logout(page);

    // Attempt login with wrong password
    await page.goto("/login");
    await page.locator('input[name="email"]').fill(user.email);
    await page.locator('input[name="password"]').fill("WrongPassword!@#");
    await page
      .getByRole("button", { name: "Log in", exact: true })
      .click();

    // Should stay on /login
    await expect(page).toHaveURL(/\/login/);
    // Should show an error message from Supabase
    await expect(
      page.getByText(/invalid login credentials|invalid|incorrect/i),
    ).toBeVisible();
    // Should not have set a session — confirm by trying to access /dashboard
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });

  test("a logged-in user can log out and afterwards cannot access /dashboard", async ({
    page,
  }) => {
    await signUpNewUser(page);
    // We're on /dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    await logout(page);
    await expect(page).toHaveURL(/\/login/);

    // Try to go back to /dashboard
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });
});

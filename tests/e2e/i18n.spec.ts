import { test, expect } from "./auth-fixture";

test.describe("Phase 16 — Multilingual v1 (i18n)", () => {
  test("default locale is English; switching to French translates the navbar + dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Default English: Dashboard appears in NavBar.
    await expect(
      page.getByRole("heading", { name: /Welcome/ }),
    ).toBeVisible();
    await expect(
      page.locator('a[href="/dashboard"]').filter({ hasText: "Dashboard" }).first(),
    ).toBeVisible();

    // Switch to French via the dropdown.
    const switcher = page.locator(
      '[data-language-switcher-select="true"]',
    );
    await switcher.selectOption("fr");

    // Wait for revalidation to settle, then check French copy.
    await expect(
      page.getByRole("heading", { name: /Bienvenue/ }),
    ).toBeVisible({ timeout: 10_000 });

    // NavBar links flipped to French.
    await expect(
      page
        .locator('a[href="/dashboard"]')
        .filter({ hasText: "Tableau de bord" })
        .first(),
    ).toBeVisible();
  });

  test("locale persists across navigation (cookie-backed)", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page
      .locator('[data-language-switcher-select="true"]')
      .selectOption("sw");

    // Swahili greeting on dashboard.
    await expect(page.getByRole("heading", { name: /Karibu/ })).toBeVisible({
      timeout: 10_000,
    });

    // Navigate to projects, then back: still Swahili.
    await page.goto("/projects");
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /Karibu/ })).toBeVisible();

    // Switch back to English so other tests don't see Swahili copy.
    await page
      .locator('[data-language-switcher-select="true"]')
      .selectOption("en");
    await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("homepage and login/signup translate too", async ({ browser }) => {
    // Use a fresh anonymous context so we set the cookie via API and
    // see the public page render in French.
    const ctx = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const page = await ctx.newPage();

    // Set the cookie directly so anonymous viewer also gets fr.
    await ctx.addCookies([
      {
        name: "ai-all-app-locale",
        value: "fr",
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.goto("/");
    // Homepage hero should be in French.
    await expect(
      page.getByRole("heading", {
        name: /Devenez vraiment bon en IA/,
      }),
    ).toBeVisible();

    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: /Bon retour/ }),
    ).toBeVisible();

    await page.goto("/signup");
    await expect(
      page.getByRole("heading", { name: /Commencez gratuitement/ }),
    ).toBeVisible();

    await ctx.close();
  });
});

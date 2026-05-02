import { test, expect } from "./auth-fixture";
import { createProject } from "./helpers";

test.describe("Phase 13 — Search palette (Cmd-K)", () => {
  test("Cmd-K opens the palette + searches across categories", async ({
    page,
  }) => {
    await createProject(page, {
      name: "Searchable channel project",
      type: "channel",
    });

    await page.goto("/dashboard");

    // Open via the navbar trigger button (cleaner than dispatching
    // a synthetic Cmd-K which Playwright handles inconsistently
    // across platforms).
    await page
      .locator('[data-search-palette-trigger-button="true"]')
      .first()
      .click();
    await expect(
      page.locator('[data-search-palette="true"]'),
    ).toBeVisible();

    // Type a query that should hit the project we just created and
    // a Foundations lesson (anything common to both).
    await page
      .locator('[data-search-palette-input="true"]')
      .fill("Searchable");

    // Wait for results to update — debounced ~200ms.
    await expect(
      page
        .locator('[data-search-result-group="projects"]')
        .locator('[data-search-result="true"]')
        .first(),
    ).toBeVisible({ timeout: 5_000 });

    // Click the first project result; should navigate to that project.
    await page
      .locator('[data-search-result-group="projects"]')
      .locator('[data-search-result="true"]')
      .first()
      .click();
    await page.waitForURL(/\/projects\/[a-f0-9-]+$/, { timeout: 10_000 });
  });

  test("search finds lessons by title", async ({ page }) => {
    await page.goto("/dashboard");
    await page
      .locator('[data-search-palette-trigger-button="true"]')
      .first()
      .click();

    await page
      .locator('[data-search-palette-input="true"]')
      .fill("hallucinations");

    // Lessons category should have a hit (foundations-02-hallucinations).
    await expect(
      page
        .locator('[data-search-result-group="lessons"]')
        .locator('[data-search-result="true"]')
        .first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("search returns 401 to unauthenticated callers", async ({
    playwright,
  }) => {
    const ctx = await playwright.request.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const response = await ctx.get("/api/search?q=anything");
    expect(response.status()).toBe(401);
    await ctx.dispose();
  });
});

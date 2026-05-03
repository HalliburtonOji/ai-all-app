import { test, expect } from "./auth-fixture";

test.describe("Phase 14 — Opportunity radar", () => {
  test("page renders + scan returns mock results", async ({ page }) => {
    await page.goto("/me/opportunities");
    await expect(
      page.getByRole("heading", { name: /Find work from public feeds/ }),
    ).toBeVisible();
    await expect(page.locator('[data-radar-form="true"]')).toBeVisible();

    await page.locator('[data-radar-keyword="true"]').fill("designer");
    await page.locator('[data-radar-search-button="true"]').click();

    const results = page.locator("[data-radar-opportunity-id]");
    await expect(results.first()).toBeVisible({ timeout: 10_000 });

    // Mock-mode marker confirms wiring + keyword passthrough.
    await expect(results.first()).toContainText("[mock-radar]");
    await expect(results.first()).toContainText("designer");

    // Three sources represented in mock mode.
    expect(await results.count()).toBeGreaterThanOrEqual(3);
  });

  test("/api/opportunities rejects unauthenticated callers", async ({
    playwright,
  }) => {
    const ctx = await playwright.request.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const response = await ctx.get("/api/opportunities?q=designer");
    expect(response.status()).toBe(401);
    await ctx.dispose();
  });
});

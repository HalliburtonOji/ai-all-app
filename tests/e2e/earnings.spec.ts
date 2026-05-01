import { test, expect } from "./auth-fixture";
import { signUpNewUser } from "./helpers";

/**
 * Each test signs up a fresh user. Earnings are user-scoped and
 * accumulate across tests within a worker, so per-test isolation is
 * the cleanest way to avoid state leakage.
 */
test.describe("Phase 4b — income tracker", () => {
  test("add an entry, persists + lifetime total updates", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUpNewUser(page);

    await page.goto("/me/earnings");
    await expect(
      page.getByRole("heading", { name: /What you've made/ }),
    ).toBeVisible();
    await expect(page.locator('[data-earnings-empty="true"]')).toBeVisible();

    await page.locator('[data-earning-input="amount"]').fill("250");
    await page.locator('[data-earning-input="currency"]').selectOption("USD");
    await page
      .locator('[data-earning-input="source"]')
      .fill("Logo for first client");
    await page.locator('[data-earning-submit="true"]').click();

    const row = page.locator("[data-earning-id]").first();
    await expect(row).toBeVisible({ timeout: 10_000 });
    await expect(row).toHaveAttribute("data-earning-currency", "USD");
    await expect(row).toContainText("Logo for first client");

    await expect(
      page.locator('[data-earnings-total-currency="USD"]'),
    ).toContainText("$250.00");

    await page.reload();
    await expect(page.locator("[data-earning-id]")).toHaveCount(1);
    await expect(
      page.locator('[data-earnings-total-currency="USD"]'),
    ).toContainText("$250.00");

    await ctx.close();
  });

  test("multi-currency: each currency totals independently", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUpNewUser(page);

    await page.goto("/me/earnings");

    await page.locator('[data-earning-input="amount"]').fill("100");
    await page.locator('[data-earning-input="currency"]').selectOption("USD");
    await page.locator('[data-earning-input="source"]').fill("USD payment");
    await page.locator('[data-earning-submit="true"]').click();
    await expect(page.locator("[data-earning-id]")).toHaveCount(1, {
      timeout: 10_000,
    });

    await page.locator('[data-earning-input="amount"]').fill("50000");
    await page.locator('[data-earning-input="currency"]').selectOption("NGN");
    await page.locator('[data-earning-input="source"]').fill("NGN payment");
    await page.locator('[data-earning-submit="true"]').click();
    await expect(page.locator("[data-earning-id]")).toHaveCount(2, {
      timeout: 10_000,
    });

    await expect(
      page.locator('[data-earnings-total-currency="USD"]'),
    ).toContainText("$100.00");
    await expect(
      page.locator('[data-earnings-total-currency="NGN"]'),
    ).toContainText("₦50,000.00");

    await expect(
      page.locator('[data-earnings-chart-currency="USD"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-earnings-chart-currency="NGN"]'),
    ).toBeVisible();

    await ctx.close();
  });

  test("delete an entry: confirm + row gone + total drops", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUpNewUser(page);

    await page.goto("/me/earnings");

    await page.locator('[data-earning-input="amount"]').fill("75");
    await page.locator('[data-earning-input="currency"]').selectOption("GBP");
    await page.locator('[data-earning-input="source"]').fill("Doomed entry");
    await page.locator('[data-earning-submit="true"]').click();

    const row = page.locator("[data-earning-id]").first();
    await expect(row).toBeVisible({ timeout: 10_000 });

    await row.locator('[data-earning-delete="true"]').click();
    await row.locator('[data-earning-confirm-delete="true"]').click();

    await expect(page.locator("[data-earning-id]")).toHaveCount(0, {
      timeout: 10_000,
    });
    await expect(
      page.locator('[data-earnings-total-currency="GBP"]'),
    ).toHaveCount(0);

    await ctx.close();
  });

  test("RLS: user B cannot see user A's earnings", async ({ browser }) => {
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await signUpNewUser(pageA);
    await pageA.goto("/me/earnings");
    await pageA.locator('[data-earning-input="amount"]').fill("999");
    await pageA.locator('[data-earning-input="currency"]').selectOption("USD");
    await pageA
      .locator('[data-earning-input="source"]')
      .fill("A's secret payment");
    await pageA.locator('[data-earning-submit="true"]').click();
    await expect(pageA.locator("[data-earning-id]")).toHaveCount(1, {
      timeout: 10_000,
    });
    await ctxA.close();

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await signUpNewUser(pageB);
    await pageB.goto("/me/earnings");
    await expect(pageB.locator('[data-earnings-empty="true"]')).toBeVisible();
    await expect(pageB.locator("[data-earning-id]")).toHaveCount(0);
    await ctxB.close();
  });

  test("CSV export returns user's entries with header row", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUpNewUser(page);

    await page.goto("/me/earnings");
    await page.locator('[data-earning-input="amount"]').fill("42");
    await page.locator('[data-earning-input="currency"]').selectOption("USD");
    await page
      .locator('[data-earning-input="source"]')
      .fill("CSV-test payment");
    await page.locator('[data-earning-submit="true"]').click();
    await expect(page.locator("[data-earning-id]")).toHaveCount(1, {
      timeout: 10_000,
    });

    const response = await page.request.get("/api/me/earnings/export");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/csv");
    const body = await response.text();
    expect(body.startsWith("date,amount,currency,source")).toBe(true);
    expect(body).toContain("CSV-test payment");
    expect(body).toContain("42.00");
    expect(body).toContain("USD");

    await ctx.close();
  });

  test("amount = 0 rejected, error shown", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUpNewUser(page);

    await page.goto("/me/earnings");

    // The browser min="0.01" would block submit pre-flight; remove it
    // so we exercise the SERVER's amount-must-be-positive check.
    await page.evaluate(() => {
      const el = document.querySelector(
        '[data-earning-input="amount"]',
      ) as HTMLInputElement | null;
      if (el) el.removeAttribute("min");
    });

    await page.locator('[data-earning-input="amount"]').fill("0");
    await page.locator('[data-earning-input="currency"]').selectOption("USD");
    await page.locator('[data-earning-input="source"]').fill("Free work");
    await page.locator('[data-earning-submit="true"]').click();

    await expect(
      page.locator('[data-earning-error="true"]'),
    ).toBeVisible({ timeout: 5_000 });
    await expect(page.locator("[data-earning-id]")).toHaveCount(0);

    await ctx.close();
  });
});

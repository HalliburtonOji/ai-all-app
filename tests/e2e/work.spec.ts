import { test, expect } from "./auth-fixture";
import { signUpNewUser } from "./helpers";

const JOB_TITLE_A = "Freelance brand designer";

/**
 * Phase 8 — Work layer (AI Audit + profession packs).
 * Each test signs up a fresh user — audits are user-scoped.
 */

test.describe("Phase 8 — Work layer · AI Audit", () => {
  test("create an audit, see the AI summary, persists across reload", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUpNewUser(page);

    await page.goto("/me/work");
    await expect(
      page.getByRole("heading", { name: /AI and your job/ }),
    ).toBeVisible();

    await page.locator('[data-work-new-audit="true"]').click();
    await page.waitForURL(/\/me\/work\/audit\/new$/);

    await page.locator('[data-audit-input="job_title"]').fill(JOB_TITLE_A);
    await page
      .locator('[data-audit-input="responsibilities"]')
      .fill("Design brand systems for early-stage SaaS clients.");
    await page
      .locator('[data-audit-input="worries"]')
      .fill("Junior designers using AI feel cheaper than me.");
    await page.locator('[data-audit-submit="true"]').click();

    // Lands on the audit detail page with the mock-audit summary.
    await page.waitForURL(/\/me\/work\/audit\/[a-f0-9-]+$/, {
      timeout: 15_000,
    });
    await expect(page.locator('[data-audit-summary="true"]')).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.locator('[data-audit-summary="true"]'),
    ).toContainText("[mock-audit]");
    await expect(
      page.locator('[data-audit-summary="true"]'),
    ).toContainText(JOB_TITLE_A);
    await expect(page.locator('[data-audit-summary="true"]')).toHaveAttribute(
      "data-audit-model",
      "mock-audit",
    );

    await page.reload();
    await expect(page.locator('[data-audit-summary="true"]')).toBeVisible();

    // Back to landing — the audit shows in the list.
    await page.goto("/me/work");
    await expect(
      page.locator('[data-work-audit-list="true"]'),
    ).toBeVisible();
    await expect(page.locator("[data-audit-id]")).toHaveCount(1);

    await ctx.close();
  });

  test("delete an audit redirects to /me/work and removes it", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUpNewUser(page);

    await page.goto("/me/work/audit/new");
    await page
      .locator('[data-audit-input="job_title"]')
      .fill("To be deleted");
    await page.locator('[data-audit-submit="true"]').click();
    await page.waitForURL(/\/me\/work\/audit\/[a-f0-9-]+$/, {
      timeout: 15_000,
    });
    await expect(page.locator('[data-audit-summary="true"]')).toBeVisible({
      timeout: 10_000,
    });

    await page.locator('[data-audit-delete="true"]').click();
    await page.locator('[data-audit-confirm-delete="true"]').click();

    await page.waitForURL(/\/me\/work$/, { timeout: 10_000 });
    await expect(page.locator("[data-audit-id]")).toHaveCount(0);

    await ctx.close();
  });

  test("RLS: user B cannot see user A's audits", async ({ browser }) => {
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await signUpNewUser(pageA);
    await pageA.goto("/me/work/audit/new");
    await pageA
      .locator('[data-audit-input="job_title"]')
      .fill("A's secret job");
    await pageA.locator('[data-audit-submit="true"]').click();
    await pageA.waitForURL(/\/me\/work\/audit\/[a-f0-9-]+$/, {
      timeout: 15_000,
    });
    await ctxA.close();

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await signUpNewUser(pageB);
    await pageB.goto("/me/work");
    await expect(pageB.locator("[data-audit-id]")).toHaveCount(0);

    await ctxB.close();
  });

  test("missing job title is rejected", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUpNewUser(page);

    await page.goto("/me/work/audit/new");

    // Browser blocks submit because the input has `required`. Bypass
    // it via DOM to exercise the SERVER's validation.
    await page.evaluate(() => {
      const el = document.querySelector(
        '[data-audit-input="job_title"]',
      ) as HTMLInputElement | null;
      if (el) el.removeAttribute("required");
    });
    await page.locator('[data-audit-submit="true"]').click();
    await expect(page.locator('[data-audit-error="true"]')).toBeVisible({
      timeout: 5_000,
    });
    // Still on the new-audit page.
    expect(page.url()).toMatch(/\/me\/work\/audit\/new/);

    await ctx.close();
  });
});

test.describe("Phase 8 — Work layer · Profession packs", () => {
  test("packs catalog renders all packs and a card opens detail", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUpNewUser(page);

    await page.goto("/me/work/packs");
    await expect(
      page.getByRole("heading", { name: /Curated guides by role/ }),
    ).toBeVisible();
    await expect(
      page.locator('[data-packs-list="true"]'),
    ).toBeVisible();
    // We shipped 4 packs to start.
    const cards = page.locator("[data-pack-card]");
    expect(await cards.count()).toBeGreaterThanOrEqual(4);

    await page.locator('[data-pack-card="designer"]').click();
    await page.waitForURL(/\/me\/work\/packs\/designer$/);
    await expect(
      page.locator('[data-pack-body="true"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-pack-body="true"]'),
    ).toContainText(/Where AI is genuinely useful/);

    await ctx.close();
  });

  test("non-existent pack slug returns 404", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUpNewUser(page);

    const response = await page.goto("/me/work/packs/no-such-pack-zzz");
    expect(response?.status()).toBe(404);

    await ctx.close();
  });
});

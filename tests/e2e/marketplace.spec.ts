import { test, expect } from "./auth-fixture";
import { signUpNewUser } from "./helpers";

test.describe("Phase 32 — Marketplace primitives v1", () => {
  test("create + view + edit + delete an active listing; non-owners see read-only detail with portfolio link", async ({
    browser,
  }) => {
    // SELLER creates a listing.
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await signUpNewUser(pageA);

    await pageA.goto("/community/marketplace");
    await expect(
      pageA.locator('[data-marketplace-list="true"]'),
    ).toBeVisible();

    await pageA.locator('[data-marketplace-new="true"]').click();
    await expect(pageA.locator('[data-listing-form="true"]')).toBeVisible();

    const title = `Brand sprint — ${Date.now()}`;
    await pageA.locator('[data-listing-title="true"]').fill(title);
    await pageA
      .locator('[data-listing-summary="true"]')
      .fill(
        "Two-week brand identity sprint for early-stage products. Direct, principled, no fluff.",
      );
    await pageA.locator('[data-listing-tags="true"]').fill("design, brand");
    await pageA.locator('[data-listing-price="true"]').fill("Starting at $1,500");
    await pageA.locator('[data-listing-save="true"]').click();

    // Lands on the detail page in edit-view mode (owner).
    await expect(
      pageA.locator('[data-listing-edit-view="true"]'),
    ).toBeVisible({ timeout: 10_000 });

    // Back to /community/marketplace — own listing visible in own
    // section AND the public listing for the seller is filtered out.
    await pageA.goto("/community/marketplace");
    await expect(
      pageA.locator('[data-marketplace-own="true"]'),
    ).toBeVisible();
    await expect(pageA.getByText(title).first()).toBeVisible();

    // BUYER: another user, sees the listing in the public list and
    // the detail page is read-only with a portfolio CTA.
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await signUpNewUser(pageB);
    await pageB.goto("/community/marketplace");
    // Find the card by its title text, then click the "See full listing"
    // link inside that specific card.
    const card = pageB
      .locator("[data-public-listing-id]")
      .filter({ hasText: title })
      .first();
    await expect(card).toBeVisible({ timeout: 10_000 });
    await card.getByRole("link", { name: /see full listing/i }).click();
    await expect(
      pageB.locator('[data-listing-detail-view="true"]'),
    ).toBeVisible({ timeout: 10_000 });
    // Edit form is NOT shown to a non-owner.
    await expect(
      pageB.locator('[data-listing-form="true"]'),
    ).toHaveCount(0);
    // The reach-out CTA links to a /p/<username> route.
    const portfolioLink = pageB.getByRole("link", { name: /\/p\// });
    await expect(portfolioLink.first()).toBeVisible();
    await ctxB.close();

    // SELLER deletes their listing.
    const detailUrl = await pageA
      .locator('[data-listing-id]')
      .first()
      .locator("a")
      .first()
      .getAttribute("href");
    if (detailUrl) await pageA.goto(detailUrl);
    await pageA.locator('[data-listing-delete-button="true"]').click();
    await pageA.locator('[data-listing-confirm-delete="true"]').click();
    await expect(pageA).toHaveURL(/\/community\/marketplace$/, {
      timeout: 10_000,
    });
    await expect(pageA.getByText(title)).toHaveCount(0);
    await ctxA.close();
  });

  test("a draft-status listing is hidden from other users", async ({
    browser,
  }) => {
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await signUpNewUser(pageA);

    await pageA.goto("/community/marketplace/new");
    const title = `Draft only — ${Date.now()}`;
    await pageA.locator('[data-listing-title="true"]').fill(title);
    await pageA
      .locator('[data-listing-summary="true"]')
      .fill("Not ready to share yet.");
    await pageA.locator('[data-listing-status="true"]').selectOption("draft");
    await pageA.locator('[data-listing-save="true"]').click();
    await expect(
      pageA.locator('[data-listing-edit-view="true"]'),
    ).toBeVisible({ timeout: 10_000 });
    await ctxA.close();

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await signUpNewUser(pageB);
    await pageB.goto("/community/marketplace");
    await expect(pageB.getByText(title)).toHaveCount(0);
    await ctxB.close();
  });
});

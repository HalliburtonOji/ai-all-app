import { test, expect } from "./auth-fixture";
import { signUpNewUser } from "./helpers";

test.describe("Phase 31 — Path-mate matching v1", () => {
  test("create a public signal → another user sees it on /community/mates with matching tags highlighted", async ({
    browser,
  }) => {
    // User A: publish a public signal with two tags.
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await signUpNewUser(pageA);

    await pageA.goto("/community/mates");
    await expect(pageA.locator('[data-mate-form="true"]')).toBeVisible();

    await pageA
      .locator('[data-mate-path="true"]')
      .fill("Freelance designer building an AI-assisted practice");
    await pageA
      .locator('[data-mate-tags="true"]')
      .fill("design, freelance, africa");
    await pageA
      .locator('[data-mate-bio="true"]')
      .fill("Trying to do better client work with less burnout.");
    await pageA.locator('[data-mate-public="true"]').check();
    await pageA.locator('[data-mate-save="true"]').click();
    // Form returns to a saved state.
    await expect(pageA.getByText("Saved.")).toBeVisible({ timeout: 10_000 });
    await ctxA.close();

    // User B: visit /community/mates and confirm A's signal is listed.
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await signUpNewUser(pageB);

    // B fills their own signal but does NOT mark public — they should
    // still see A's listing because A is_public, B is logged in.
    await pageB.goto("/community/mates");
    await pageB
      .locator('[data-mate-path="true"]')
      .fill("Indie hacker shipping a freelance-tool SaaS");
    await pageB
      .locator('[data-mate-tags="true"]')
      .fill("indie, freelance, saas");
    await pageB.locator('[data-mate-save="true"]').click();
    await expect(pageB.getByText("Saved.")).toBeVisible({ timeout: 10_000 });
    await pageB.reload();

    const listed = pageB.locator("[data-mate-signal-id]");
    await expect(listed.first()).toBeVisible({ timeout: 10_000 });
    await expect(listed.first()).toContainText("Freelance designer");
    // The shared "freelance" tag should be highlighted as a match.
    const freelanceTag = listed
      .first()
      .locator('[data-mate-tag="freelance"]');
    await expect(freelanceTag).toHaveAttribute(
      "data-mate-tag-match",
      "true",
    );
    await ctxB.close();
  });

  test("a private signal does not appear in another user's discovery list", async ({
    browser,
  }) => {
    // Use a unique marker phrase so we can assert it's absent on User
    // B's view regardless of any other public signals from other tests.
    const marker = `Private path marker ${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;

    // User A: signal saved but is_public = false.
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await signUpNewUser(pageA);
    await pageA.goto("/community/mates");
    await pageA.locator('[data-mate-path="true"]').fill(marker);
    await pageA.locator('[data-mate-save="true"]').click();
    await expect(pageA.getByText("Saved.")).toBeVisible({ timeout: 10_000 });
    await expect(pageA.locator('[data-mate-public="true"]')).not.toBeChecked();
    await ctxA.close();

    // User B: should NOT see User A's private signal anywhere on the
    // page. Other public signals from other tests may exist; we don't
    // care, we only assert this private one is absent.
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await signUpNewUser(pageB);
    await pageB.goto("/community/mates");
    await expect(pageB.locator("[data-mates-list]")).toBeVisible({
      timeout: 10_000,
    });
    await expect(pageB.getByText(marker)).toHaveCount(0);
    await ctxB.close();
  });
});

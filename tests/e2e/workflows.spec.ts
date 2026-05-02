import { test, expect } from "./auth-fixture";
import { createProject, signUpNewUser } from "./helpers";

test.describe("Phase 12 — Workflow chains", () => {
  test("create + run + delete a chain", async ({ page }) => {
    const projectId = await createProject(page, {
      name: "Workflow happy path",
      type: "client",
    });

    await page.goto(`/projects/${projectId}?tab=studio&studio=workflows`);
    await expect(
      page.locator('[data-studio-panel="workflows"]'),
    ).toBeVisible();
    await expect(page.locator('[data-workflows-empty="true"]')).toBeVisible();

    // Create a 2-step chain.
    await page.locator('[data-workflow-new="true"]').click();
    await expect(
      page.locator('[data-workflows-edit-view="true"]'),
    ).toBeVisible();

    await page
      .locator('[data-workflow-name="true"]')
      .fill("Notes → tweet thread");
    await page
      .locator('[data-workflow-description="true"]')
      .fill("Test chain");

    // Step 1 (already exists)
    await page
      .locator('[data-workflow-step-prompt="0"]')
      .fill("Pull 3 sharp insights from: {{input}}");
    await page
      .locator('[data-workflow-step-kind="0"]')
      .selectOption("long_form");

    // Add step 2
    await page.locator('[data-workflow-step-add="true"]').click();
    await page
      .locator('[data-workflow-step-prompt="1"]')
      .fill("Turn each insight into one tweet: {{previous_output}}");
    await page
      .locator('[data-workflow-step-kind="1"]')
      .selectOption("social_post");

    await page.locator('[data-workflow-save="true"]').click();

    // Land back on the list view with the new chain visible.
    await expect(
      page.locator('[data-workflows-list="true"]'),
    ).toBeVisible({ timeout: 10_000 });
    const chainCard = page.locator("[data-workflow-id]").first();
    await expect(chainCard).toBeVisible();
    await expect(chainCard).toContainText("Notes → tweet thread");
    await expect(chainCard).toContainText("2 steps");

    // Run the chain.
    await chainCard.locator('[data-workflow-run-button]').first().click();
    await expect(
      page.locator('[data-workflows-run-view="true"]'),
    ).toBeVisible();

    await page
      .locator('[data-workflow-run-input="true"]')
      .fill("Raw notes from a 30-min walk: AI tools, freelance pricing, audience.");
    await page.locator('[data-workflow-run-submit="true"]').click();

    // Both step results render with mock-mode markers.
    const stepResults = page.locator("[data-workflow-result-order]");
    await expect(stepResults).toHaveCount(2, { timeout: 15_000 });
    await expect(stepResults.nth(0)).toContainText("kind=long_form");
    await expect(stepResults.nth(1)).toContainText("kind=social_post");

    // Back to list, then delete.
    await page.goto(`/projects/${projectId}?tab=studio&studio=workflows`);
    const card = page.locator("[data-workflow-id]").first();
    await card.locator('[data-workflow-delete-button]').first().click();
    await card.locator('[data-workflow-confirm-delete]').first().click();
    await expect(page.locator("[data-workflow-id]")).toHaveCount(0, {
      timeout: 10_000,
    });
  });

  test("RLS: user B can't see user A's chains", async ({ browser }) => {
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await signUpNewUser(pageA);
    const projectIdA = await createProject(pageA, {
      name: "User A workflow project",
      type: "client",
    });
    await pageA.goto(
      `/projects/${projectIdA}?tab=studio&studio=workflows`,
    );
    await pageA.locator('[data-workflow-new="true"]').click();
    await pageA.locator('[data-workflow-name="true"]').fill("A's chain");
    await pageA
      .locator('[data-workflow-step-prompt="0"]')
      .fill("Process this: {{input}}");
    await pageA.locator('[data-workflow-save="true"]').click();
    await expect(pageA.locator("[data-workflow-id]")).toHaveCount(1, {
      timeout: 10_000,
    });
    await ctxA.close();

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await signUpNewUser(pageB);
    const projectIdB = await createProject(pageB, {
      name: "User B workflow project",
      type: "client",
    });
    await pageB.goto(
      `/projects/${projectIdB}?tab=studio&studio=workflows`,
    );
    await expect(pageB.locator('[data-workflows-empty="true"]')).toBeVisible();
    await expect(pageB.locator("[data-workflow-id]")).toHaveCount(0);
    await ctxB.close();
  });
});

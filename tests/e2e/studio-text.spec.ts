import { test, expect } from "./auth-fixture";
import { createProject, signUpNewUser } from "./helpers";

test.describe("Studio v2 — copy/email drafter", () => {
  test("generate text draft → tile appears + persists across reload", async ({
    page,
  }) => {
    const projectId = await createProject(page, {
      name: "Text drafter happy path",
      type: "channel",
    });

    await page.goto(`/projects/${projectId}?tab=studio&studio=text`);
    await expect(page.locator('[data-studio-panel="text"]')).toBeVisible();

    await page
      .getByLabel("Text draft prompt")
      .fill("Draft a short tweet about my new channel.");
    await page.locator('[data-studio-generate-button="text"]').click();

    const firstTile = page
      .locator('[data-studio-output-kind="text"]')
      .first();
    await expect(firstTile).toBeVisible({ timeout: 15_000 });

    await page.reload();
    await expect(
      page.locator('[data-studio-output-kind="text"]'),
    ).toHaveCount(1);
  });

  test("empty prompt shows validation; no tile created", async ({ page }) => {
    const projectId = await createProject(page, {
      name: "Text empty prompt",
      type: "channel",
    });

    await page.goto(`/projects/${projectId}?tab=studio&studio=text`);

    const promptField = page.getByLabel("Text draft prompt");
    await promptField.fill("   ");
    await page.locator('[data-studio-generate-button="text"]').click();

    await expect(page.locator('[data-studio-error="text"]')).toBeVisible({
      timeout: 5_000,
    });
    await expect(
      page.locator('[data-studio-output-kind="text"]'),
    ).toHaveCount(0);
  });

  test("RLS: user B cannot see user A's text drafts", async ({ browser }) => {
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await signUpNewUser(pageA);
    const projectIdA = await createProject(pageA, {
      name: "User A text drafts",
      type: "channel",
    });

    await pageA.goto(`/projects/${projectIdA}?tab=studio&studio=text`);
    await pageA
      .getByLabel("Text draft prompt")
      .fill("A's secret email draft");
    await pageA.locator('[data-studio-generate-button="text"]').click();
    await expect(
      pageA.locator('[data-studio-output-kind="text"]').first(),
    ).toBeVisible({ timeout: 15_000 });
    await ctxA.close();

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await signUpNewUser(pageB);

    const responseB = await pageB.goto(
      `/projects/${projectIdA}?tab=studio&studio=text`,
    );
    expect(responseB?.status()).toBe(404);

    const projectIdB = await createProject(pageB, {
      name: "User B text drafts",
      type: "channel",
    });
    await pageB.goto(`/projects/${projectIdB}?tab=studio&studio=text`);
    await expect(
      pageB.locator('[data-studio-empty-state="text"]'),
    ).toBeVisible();
    await expect(
      pageB.locator('[data-studio-output-kind="text"]'),
    ).toHaveCount(0);

    await ctxB.close();
  });

  test("delete text draft: tile gone, persists across reload", async ({
    page,
  }) => {
    const projectId = await createProject(page, {
      name: "Text delete test",
      type: "channel",
    });

    await page.goto(`/projects/${projectId}?tab=studio&studio=text`);
    await page.getByLabel("Text draft prompt").fill("To be deleted");
    await page.locator('[data-studio-generate-button="text"]').click();

    const tile = page.locator('[data-studio-output-kind="text"]').first();
    await expect(tile).toBeVisible({ timeout: 15_000 });

    await tile.hover();
    await tile.getByRole("button", { name: "Delete output" }).click();

    await expect(
      page.locator('[data-studio-output-kind="text"]'),
    ).toHaveCount(0, { timeout: 10_000 });
    await page.reload();
    await expect(
      page.locator('[data-studio-output-kind="text"]'),
    ).toHaveCount(0);
  });

  test("memory-aware: generated tile records 'mock-text-with-context'", async ({
    page,
  }) => {
    const projectId = await createProject(page, {
      name: "Memory-aware text drafter",
      type: "channel",
    });

    // Seed a project_fact.
    await page.goto(`/projects/${projectId}?tab=memory`);
    await page.locator('[data-extract-button="true"]').click();
    await expect(page.locator("[data-fact-id]").first()).toBeVisible({
      timeout: 10_000,
    });

    await page.goto(`/projects/${projectId}?tab=studio&studio=text`);
    await page
      .getByLabel("Text draft prompt")
      .fill("Quick caption for next post");
    await page.locator('[data-studio-generate-button="text"]').click();

    const tile = page.locator('[data-studio-output-kind="text"]').first();
    await expect(tile).toBeVisible({ timeout: 15_000 });
    await expect(tile).toHaveAttribute(
      "data-studio-output-model",
      "mock-text-with-context",
    );
  });
});

import { test, expect } from "@playwright/test";
import { createProject, signUpNewUser } from "./helpers";

test.describe("Studio v2 — image generation", () => {
  test("generate image → tile appears in gallery + persists across reload", async ({
    page,
  }) => {
    await signUpNewUser(page);
    const projectId = await createProject(page, {
      name: "Studio happy path",
      type: "channel",
    });

    await page.goto(`/projects/${projectId}?tab=studio&studio=image`);
    await expect(page.locator('[data-studio-panel="image"]')).toBeVisible();

    await page
      .getByLabel("Image prompt")
      .fill("A neon-lit Lagos street market at dusk");
    await page.locator('[data-studio-generate-button="true"]').click();

    const firstTile = page
      .locator('[data-studio-output-kind="image"]')
      .first();
    await expect(firstTile).toBeVisible({ timeout: 15_000 });

    await page.reload();
    await expect(
      page.locator('[data-studio-output-kind="image"]'),
    ).toHaveCount(1);
  });

  test("empty prompt shows validation; no tile created", async ({ page }) => {
    await signUpNewUser(page);
    const projectId = await createProject(page, {
      name: "Studio empty prompt",
      type: "channel",
    });

    await page.goto(`/projects/${projectId}?tab=studio&studio=image`);

    const promptField = page.getByLabel("Image prompt");
    await promptField.fill("   ");
    await page.locator('[data-studio-generate-button="true"]').click();

    await expect(page.locator('[data-studio-error="true"]')).toBeVisible({
      timeout: 5_000,
    });
    await expect(
      page.locator('[data-studio-output-kind="image"]'),
    ).toHaveCount(0);
  });

  test("RLS: user B cannot see user A's images", async ({ browser }) => {
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await signUpNewUser(pageA);
    const projectIdA = await createProject(pageA, {
      name: "User A studio project",
      type: "channel",
    });

    await pageA.goto(`/projects/${projectIdA}?tab=studio&studio=image`);
    await pageA.getByLabel("Image prompt").fill("A's secret image");
    await pageA.locator('[data-studio-generate-button="true"]').click();
    await expect(
      pageA.locator('[data-studio-output-kind="image"]').first(),
    ).toBeVisible({ timeout: 15_000 });
    await ctxA.close();

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await signUpNewUser(pageB);

    const responseB = await pageB.goto(
      `/projects/${projectIdA}?tab=studio&studio=image`,
    );
    expect(responseB?.status()).toBe(404);

    const projectIdB = await createProject(pageB, {
      name: "User B studio project",
      type: "channel",
    });
    await pageB.goto(`/projects/${projectIdB}?tab=studio&studio=image`);
    await expect(
      pageB.locator('[data-studio-empty-state="image"]'),
    ).toBeVisible();
    await expect(
      pageB.locator('[data-studio-output-kind="image"]'),
    ).toHaveCount(0);

    await ctxB.close();
  });

  test("delete image: tile gone, persists across reload", async ({ page }) => {
    await signUpNewUser(page);
    const projectId = await createProject(page, {
      name: "Studio delete test",
      type: "channel",
    });

    await page.goto(`/projects/${projectId}?tab=studio&studio=image`);
    await page.getByLabel("Image prompt").fill("To be deleted");
    await page.locator('[data-studio-generate-button="true"]').click();

    const tile = page.locator('[data-studio-output-kind="image"]').first();
    await expect(tile).toBeVisible({ timeout: 15_000 });

    await tile.hover();
    await tile.getByRole("button", { name: "Delete output" }).click();

    await expect(
      page.locator('[data-studio-output-kind="image"]'),
    ).toHaveCount(0, { timeout: 10_000 });
    await page.reload();
    await expect(
      page.locator('[data-studio-output-kind="image"]'),
    ).toHaveCount(0);
  });

  test("Studio image not visible on Coach tab", async ({ page }) => {
    await signUpNewUser(page);
    const projectId = await createProject(page, {
      name: "Studio tab isolation",
      type: "channel",
    });

    await page.goto(`/projects/${projectId}?tab=studio&studio=image`);
    await page.getByLabel("Image prompt").fill("Tab isolation test");
    await page.locator('[data-studio-generate-button="true"]').click();
    await expect(
      page.locator('[data-studio-output-kind="image"]').first(),
    ).toBeVisible({ timeout: 15_000 });

    await page.goto(`/projects/${projectId}`);
    await expect(
      page.locator('[data-studio-output-kind="image"]'),
    ).toHaveCount(0);
  });

  test("memory-aware: generated tile records 'mock-with-context' model", async ({
    page,
  }) => {
    await signUpNewUser(page);
    const projectId = await createProject(page, {
      name: "Memory-aware studio",
      type: "channel",
    });

    // Seed a project_fact via the admin extract button on the Memory tab.
    await page.goto(`/projects/${projectId}?tab=memory`);
    await page.locator('[data-extract-button="true"]').click();
    await expect(page.locator("[data-fact-id]").first()).toBeVisible({
      timeout: 10_000,
    });

    await page.goto(`/projects/${projectId}?tab=studio&studio=image`);
    await page.getByLabel("Image prompt").fill("memory-aware portrait");
    await page.locator('[data-studio-generate-button="true"]').click();

    const tile = page.locator('[data-studio-output-kind="image"]').first();
    await expect(tile).toBeVisible({ timeout: 15_000 });
    await expect(tile).toHaveAttribute(
      "data-studio-output-model",
      "mock-with-context",
    );
  });

  test("tool grid landing shows 3 cards, no panel", async ({ page }) => {
    await signUpNewUser(page);
    const projectId = await createProject(page, {
      name: "Tool grid",
      type: "channel",
    });

    await page.goto(`/projects/${projectId}?tab=studio`);
    await expect(
      page.locator('[data-studio-tool-grid="true"]'),
    ).toBeVisible();
    await expect(page.locator("[data-studio-tool-card]")).toHaveCount(3);
    // No specific panel rendered yet
    await expect(page.locator('[data-studio-panel="image"]')).toHaveCount(0);
    await expect(page.locator('[data-studio-panel="text"]')).toHaveCount(0);
    await expect(page.locator('[data-studio-panel="voice"]')).toHaveCount(0);
  });
});

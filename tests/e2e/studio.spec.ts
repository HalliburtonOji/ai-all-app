import { test, expect } from "@playwright/test";
import { createProject, signUpNewUser } from "./helpers";

test.describe("Studio v1 — image generation", () => {
  test("generate image → tile appears in gallery + persists across reload", async ({
    page,
  }) => {
    await signUpNewUser(page);
    const projectId = await createProject(page, {
      name: "Studio happy path",
      type: "channel",
    });

    await page.goto(`/projects/${projectId}?tab=studio`);
    await expect(
      page.locator('[data-studio-panel="true"]'),
    ).toBeVisible();

    await page.getByLabel("Image prompt").fill("A neon-lit Lagos street market at dusk");
    await page
      .locator('[data-studio-generate-button="true"]')
      .click();

    const firstTile = page.locator("[data-studio-image-id]").first();
    await expect(firstTile).toBeVisible({ timeout: 15_000 });

    await page.reload();
    await expect(page.locator("[data-studio-image-id]")).toHaveCount(1);
  });

  test("empty prompt shows validation; no tile created", async ({ page }) => {
    await signUpNewUser(page);
    const projectId = await createProject(page, {
      name: "Studio empty prompt",
      type: "channel",
    });

    await page.goto(`/projects/${projectId}?tab=studio`);

    // Browser-level required validation — submit without typing
    const promptField = page.getByLabel("Image prompt");
    await promptField.fill("   ");
    // Required + minLength=1 means the form may submit (whitespace is non-empty
    // for HTML5 purposes), so the server action should bounce it back as an error.
    await page
      .locator('[data-studio-generate-button="true"]')
      .click();

    await expect(page.locator('[data-studio-error="true"]')).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.locator("[data-studio-image-id]")).toHaveCount(0);
  });

  test("RLS: user B cannot see user A's images", async ({ browser }) => {
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await signUpNewUser(pageA);
    const projectIdA = await createProject(pageA, {
      name: "User A studio project",
      type: "channel",
    });

    await pageA.goto(`/projects/${projectIdA}?tab=studio`);
    await pageA.getByLabel("Image prompt").fill("A's secret image");
    await pageA.locator('[data-studio-generate-button="true"]').click();
    await expect(
      pageA.locator("[data-studio-image-id]").first(),
    ).toBeVisible({ timeout: 15_000 });
    await ctxA.close();

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await signUpNewUser(pageB);

    // Direct visit to A's project URL → 404 (project RLS already enforces)
    const responseB = await pageB.goto(`/projects/${projectIdA}?tab=studio`);
    expect(responseB?.status()).toBe(404);

    // B's own studio tab is empty
    const projectIdB = await createProject(pageB, {
      name: "User B studio project",
      type: "channel",
    });
    await pageB.goto(`/projects/${projectIdB}?tab=studio`);
    await expect(
      pageB.locator('[data-studio-empty-state="true"]'),
    ).toBeVisible();
    await expect(pageB.locator("[data-studio-image-id]")).toHaveCount(0);

    await ctxB.close();
  });

  test("delete image: tile gone, persists across reload", async ({ page }) => {
    await signUpNewUser(page);
    const projectId = await createProject(page, {
      name: "Studio delete test",
      type: "channel",
    });

    await page.goto(`/projects/${projectId}?tab=studio`);
    await page.getByLabel("Image prompt").fill("To be deleted");
    await page.locator('[data-studio-generate-button="true"]').click();

    const tile = page.locator("[data-studio-image-id]").first();
    await expect(tile).toBeVisible({ timeout: 15_000 });

    await tile.hover();
    await tile.getByRole("button", { name: "Delete image" }).click();

    await expect(page.locator("[data-studio-image-id]")).toHaveCount(0, {
      timeout: 10_000,
    });
    await page.reload();
    await expect(page.locator("[data-studio-image-id]")).toHaveCount(0);
  });

  test("Studio image not visible on Coach tab", async ({ page }) => {
    await signUpNewUser(page);
    const projectId = await createProject(page, {
      name: "Studio tab isolation",
      type: "channel",
    });

    await page.goto(`/projects/${projectId}?tab=studio`);
    await page.getByLabel("Image prompt").fill("Tab isolation test");
    await page.locator('[data-studio-generate-button="true"]').click();
    await expect(
      page.locator("[data-studio-image-id]").first(),
    ).toBeVisible({ timeout: 15_000 });

    // Switch to Coach tab and confirm no image tile is visible
    await page.goto(`/projects/${projectId}`);
    await expect(page.locator("[data-studio-image-id]")).toHaveCount(0);
  });
});

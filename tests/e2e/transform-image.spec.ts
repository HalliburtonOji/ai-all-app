import { test, expect } from "./auth-fixture";
import { createProject } from "./helpers";

test.describe("Phase 25 — Studio image transforms (upscale + remove-bg)", () => {
  test("upload an image with upscale selected → transform tile appears", async ({
    page,
  }) => {
    const projectId = await createProject(page, {
      name: "Transform happy path",
      type: "client",
    });

    await page.goto(`/projects/${projectId}?tab=studio`);
    await expect(
      page.locator('[data-studio-tool-card="transform"]'),
    ).toBeVisible();
    await page.locator('[data-studio-tool-card="transform"]').click();
    await expect(
      page.locator('[data-studio-panel="transform"]'),
    ).toBeVisible();

    // Upscale option is selected by default.
    await expect(
      page.locator('[data-transform-option="upscale"]'),
    ).toHaveAttribute("data-transform-active", "true");

    // Synthesize a tiny PNG for the upload. Mock mode never sends it
    // to Replicate, so any valid bytes work.
    await page.locator('[data-transform-input="true"]').setInputFiles({
      name: "logo.png",
      mimeType: "image/png",
      buffer: Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00,
        0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00,
        0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63,
        0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4,
        0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60,
        0x82,
      ]),
    });

    // The transform output appears in the gallery as an image tile.
    await expect(
      page.locator('[data-studio-output-kind="image"]').first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("switching to remove_bg sets the active option", async ({ page }) => {
    const projectId = await createProject(page, {
      name: "Transform option toggle",
      type: "client",
    });
    await page.goto(`/projects/${projectId}?tab=studio&studio=transform`);

    await page.locator('[data-transform-option="remove_bg"]').click();
    await expect(
      page.locator('[data-transform-option="remove_bg"]'),
    ).toHaveAttribute("data-transform-active", "true");
    await expect(
      page.locator('[data-transform-option="upscale"]'),
    ).toHaveAttribute("data-transform-active", "false");
  });
});

import { test, expect } from "@playwright/test";
import { createProject, signUpNewUser } from "./helpers";

const COACH_PLACEHOLDER = "Ask the coach anything…";

test.describe("Phase 1 — coach × studio integration", () => {
  test("coach generates an image when the user asks to draw", async ({
    page,
  }) => {
    await signUpNewUser(page);
    await createProject(page, { name: "Tool draw test", type: "channel" });

    await page
      .getByPlaceholder(COACH_PLACEHOLDER)
      .fill("draw me a friendly cat");
    await page.getByRole("button", { name: "Send", exact: true }).click();

    // Tool placeholder should appear briefly while the mock-mode helper
    // uploads + inserts the deterministic mock PNG.
    const placeholder = page.locator('[data-coach-tool-placeholder="true"]');
    await expect(placeholder).toBeVisible({ timeout: 10_000 });

    // Tool image bubble appears with the studio image rendered inline.
    const toolImage = page.locator("[data-coach-tool-image]").first();
    await expect(toolImage).toBeVisible({ timeout: 15_000 });

    // Reload — both bubbles persist (preamble + image).
    await page.reload();
    await expect(
      page.locator("[data-coach-tool-image]").first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("tool failure surfaces a Retry button", async ({ page }) => {
    await signUpNewUser(page);
    await createProject(page, { name: "Tool fail test", type: "channel" });

    // The mock generate-image helper treats "__fail__" in the prompt as a
    // forced failure so we can test the failure UX without flakes.
    await page
      .getByPlaceholder(COACH_PLACEHOLDER)
      .fill("draw me __fail__ now");
    await page.getByRole("button", { name: "Send", exact: true }).click();

    const failedBubble = page.locator('[data-coach-tool-failed="true"]');
    await expect(failedBubble).toBeVisible({ timeout: 15_000 });
    await expect(
      failedBubble.locator('[data-coach-tool-retry="true"]'),
    ).toBeVisible();
  });

  test('"Refine with coach" pre-fills the coach textarea, no auto-send', async ({
    page,
  }) => {
    await signUpNewUser(page);
    const projectId = await createProject(page, {
      name: "Refine flow test",
      type: "channel",
    });

    await page.goto(`/projects/${projectId}?tab=studio`);
    await page
      .getByLabel("Image prompt")
      .fill("a moody portrait of a fox");
    await page.locator('[data-studio-refine-button="true"]').click();

    // Lands on the coach tab (the tab=coach default — i.e. URL has no tab=studio).
    await expect(
      page.getByPlaceholder(COACH_PLACEHOLDER),
    ).toHaveValue("a moody portrait of a fox", { timeout: 10_000 });

    // No assistant message has streamed in (no auto-send).
    await expect(
      page.locator('[data-message-role="assistant"]'),
    ).toHaveCount(0);
  });

  test("tool-using suggestion routes to Studio with the prompt pre-filled", async ({
    page,
  }) => {
    await signUpNewUser(page);
    await createProject(page, { name: "Suggestion route test", type: "channel" });

    // First exchange so the tray fires.
    await page
      .getByPlaceholder(COACH_PLACEHOLDER)
      .fill("hello there");
    await page.getByRole("button", { name: "Send", exact: true }).click();

    const studioPill = page
      .locator('[data-suggestion-action="studio.image"]')
      .first();
    await expect(studioPill).toBeVisible({ timeout: 15_000 });
    const expectedPrefill =
      "A bold thumbnail with bright colors and a curious facial expression.";

    await studioPill.click();

    // Lands on the Studio tab with the prompt pre-filled into the textarea.
    await expect(
      page.locator('[data-studio-panel="true"]'),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel("Image prompt")).toHaveValue(
      expectedPrefill,
    );
  });

  test("recent activity strip appears after first image is generated", async ({
    page,
  }) => {
    await signUpNewUser(page);
    const projectId = await createProject(page, {
      name: "Activity strip test",
      type: "channel",
    });

    // Generate an image via Studio.
    await page.goto(`/projects/${projectId}?tab=studio`);
    await page
      .getByLabel("Image prompt")
      .fill("hero illustration");
    await page.locator('[data-studio-generate-button="true"]').click();
    await expect(
      page.locator("[data-studio-image-id]").first(),
    ).toBeVisible({ timeout: 15_000 });

    // Reload — strip should now be present with a thumbnail.
    await page.reload();
    const strip = page.locator('[data-recent-activity-strip="true"]');
    await expect(strip).toBeVisible();
    await expect(strip.locator("[data-recent-activity-thumb]")).toHaveCount(
      1,
    );
  });
});

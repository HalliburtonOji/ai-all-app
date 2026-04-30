import { test, expect } from "./auth-fixture";
import { createProject } from "./helpers";

const COACH_PLACEHOLDER = "Ask the coach anything…";

test.describe("Coach × studio integration", () => {
  test("coach generates an image when the user asks to draw", async ({
    page,
  }) => {
    await createProject(page, { name: "Tool draw test", type: "channel" });

    await page
      .getByPlaceholder(COACH_PLACEHOLDER)
      .fill("draw me a friendly cat");
    await page.getByRole("button", { name: "Send", exact: true }).click();

    const placeholder = page.locator('[data-coach-tool-placeholder="true"]');
    await expect(placeholder).toBeVisible({ timeout: 10_000 });

    const toolImage = page
      .locator('[data-coach-tool-output-kind="image"]')
      .first();
    await expect(toolImage).toBeVisible({ timeout: 15_000 });

    await page.reload();
    await expect(
      page.locator('[data-coach-tool-output-kind="image"]').first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("coach drafts text when asked to write", async ({ page }) => {
    await createProject(page, { name: "Tool draft test", type: "channel" });

    await page
      .getByPlaceholder(COACH_PLACEHOLDER)
      .fill("write me a short caption");
    await page.getByRole("button", { name: "Send", exact: true }).click();

    const textBubble = page
      .locator('[data-coach-tool-output-kind="text"]')
      .first();
    await expect(textBubble).toBeVisible({ timeout: 15_000 });

    await page.reload();
    await expect(
      page.locator('[data-coach-tool-output-kind="text"]').first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("coach generates a voice-over when asked to read aloud", async ({
    page,
  }) => {
    await createProject(page, { name: "Tool voice test", type: "channel" });

    await page
      .getByPlaceholder(COACH_PLACEHOLDER)
      .fill("read this aloud: hello world");
    await page.getByRole("button", { name: "Send", exact: true }).click();

    const audioBubble = page
      .locator('[data-coach-tool-output-kind="audio"]')
      .first();
    await expect(audioBubble).toBeVisible({ timeout: 15_000 });
    await expect(audioBubble.locator("audio")).toHaveCount(1);
  });

  test("tool failure surfaces a Retry button", async ({ page }) => {
    await createProject(page, { name: "Tool fail test", type: "channel" });

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
    const projectId = await createProject(page, {
      name: "Refine flow test",
      type: "channel",
    });

    await page.goto(`/projects/${projectId}?tab=studio&studio=image`);
    await page
      .getByLabel("Image prompt")
      .fill("a moody portrait of a fox");
    await page.locator('[data-studio-refine-button="true"]').click();

    await expect(
      page.getByPlaceholder(COACH_PLACEHOLDER),
    ).toHaveValue("a moody portrait of a fox", { timeout: 10_000 });

    await expect(
      page.locator('[data-message-role="assistant"]'),
    ).toHaveCount(0);
  });

  test("tool-using suggestion routes to Studio with the prompt pre-filled", async ({
    page,
  }) => {
    await createProject(page, {
      name: "Suggestion route test",
      type: "channel",
    });

    await page.getByPlaceholder(COACH_PLACEHOLDER).fill("hello there");
    await page.getByRole("button", { name: "Send", exact: true }).click();

    const studioPill = page
      .locator('[data-suggestion-action="studio.image"]')
      .first();
    await expect(studioPill).toBeVisible({ timeout: 15_000 });
    const expectedPrefill =
      "A bold thumbnail with bright colors and a curious facial expression.";

    await studioPill.click();

    await expect(page.locator('[data-studio-panel="image"]')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByLabel("Image prompt")).toHaveValue(expectedPrefill);
  });

  test("recent activity strip appears after first output is generated", async ({
    page,
  }) => {
    const projectId = await createProject(page, {
      name: "Activity strip test",
      type: "channel",
    });

    await page.goto(`/projects/${projectId}?tab=studio&studio=image`);
    await page.getByLabel("Image prompt").fill("hero illustration");
    await page.locator('[data-studio-generate-button="true"]').click();
    await expect(
      page.locator('[data-studio-output-kind="image"]').first(),
    ).toBeVisible({ timeout: 15_000 });

    await page.reload();
    const strip = page.locator('[data-recent-activity-strip="true"]');
    await expect(strip).toBeVisible();
    await expect(strip.locator("[data-recent-activity-thumb]")).toHaveCount(1);
  });
});

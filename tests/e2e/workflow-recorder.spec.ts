import { test, expect } from "./auth-fixture";
import { createProject } from "./helpers";

test.describe("Phase 19 — Workflow recorder", () => {
  test("save last 2 text generations as a workflow chain", async ({
    page,
  }) => {
    const projectId = await createProject(page, {
      name: "Recorder happy path",
      type: "channel",
    });

    // Generate 2 text outputs.
    await page.goto(`/projects/${projectId}?tab=studio&studio=text`);
    await expect(page.locator('[data-studio-panel="text"]')).toBeVisible();

    await page
      .getByLabel("Text draft prompt")
      .fill("Draft a 2-line opener about a new newsletter.");
    await page.locator('[data-studio-generate-button="text"]').click();
    await expect(
      page.locator('[data-studio-output-kind="text"]'),
    ).toHaveCount(1, { timeout: 15_000 });

    await page
      .getByLabel("Text draft prompt")
      .fill("Now expand it into 5 short bullet points.");
    await page.locator('[data-studio-generate-button="text"]').click();
    await expect(
      page.locator('[data-studio-output-kind="text"]'),
    ).toHaveCount(2, { timeout: 15_000 });

    // Recorder controls appear once 2+ outputs exist.
    await expect(page.locator('[data-recorder-panel="true"]')).toBeVisible();
    await expect(page.locator('[data-recorder-count="true"]')).toBeVisible();

    // Save as workflow.
    await page.locator('[data-recorder-save="true"]').click();
    await expect(
      page.locator('[data-recorder-saved-link="true"]'),
    ).toBeVisible({ timeout: 10_000 });

    // Open Workflows panel and confirm the recorded chain is there
    // with 2 steps.
    await page.locator('[data-recorder-saved-link="true"]').click();
    await expect(page.locator('[data-studio-panel="workflows"]')).toBeVisible();
    await expect(page.locator("[data-workflow-id]")).toHaveCount(1, {
      timeout: 10_000,
    });
    await expect(
      page.locator("[data-workflow-id]").first(),
    ).toContainText("2 steps");
  });

  test("recorder UI hidden until at least 2 text outputs exist", async ({
    page,
  }) => {
    const projectId = await createProject(page, {
      name: "Recorder gate",
      type: "channel",
    });

    await page.goto(`/projects/${projectId}?tab=studio&studio=text`);
    // Zero outputs — recorder not visible.
    await expect(page.locator('[data-recorder-panel="true"]')).toHaveCount(0);

    // One output — still hidden.
    await page
      .getByLabel("Text draft prompt")
      .fill("First and only draft.");
    await page.locator('[data-studio-generate-button="text"]').click();
    await expect(
      page.locator('[data-studio-output-kind="text"]'),
    ).toHaveCount(1, { timeout: 15_000 });
    await expect(page.locator('[data-recorder-panel="true"]')).toHaveCount(0);
  });
});

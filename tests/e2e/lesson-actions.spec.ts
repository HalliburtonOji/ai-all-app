import { test, expect } from "./auth-fixture";
import { createProject } from "./helpers";

const FIRST_LESSON_SLUG = "foundations-01-what-is-ai";

test.describe("Phase 20 — Interactive lesson actions", () => {
  test("lesson with try_it_actions renders chips that route to /projects with a pending action banner", async ({
    page,
  }) => {
    // Make sure we have at least one project so the banner has cards
    // to attach a "Use this project" button to.
    await createProject(page, {
      name: "Lesson actions test project",
      type: "exploration",
    });

    await page.goto(`/learn/${FIRST_LESSON_SLUG}`);
    const actionsBox = page.locator('[data-lesson-actions="true"]');
    await expect(actionsBox).toBeVisible();

    // The seeded "coach" action chip should be present.
    const coachChip = actionsBox.locator('[data-lesson-action-kind="coach"]').first();
    await expect(coachChip).toBeVisible();

    // Clicking the coach chip stashes the prompt and navigates to /projects.
    await coachChip.click();
    await expect(page).toHaveURL(/\/projects(\?.*)?$/, { timeout: 10_000 });

    // The pending-action banner is visible on /projects.
    await expect(
      page.locator('[data-pending-action-banner="true"]'),
    ).toBeVisible({ timeout: 10_000 });

    // The project card has a "Use this project" overlay button injected.
    await expect(
      page.locator('[data-pending-action-button="true"]').first(),
    ).toBeVisible({ timeout: 10_000 });

    // Dismiss clears the banner.
    await page.locator('[data-pending-action-dismiss="true"]').click();
    await expect(
      page.locator('[data-pending-action-banner="true"]'),
    ).toHaveCount(0);
  });

  test("start_project chip navigates straight to /projects/new", async ({
    page,
  }) => {
    await page.goto(`/learn/${FIRST_LESSON_SLUG}`);
    await page
      .locator('[data-lesson-action-kind="start_project"]')
      .first()
      .click();
    await expect(page).toHaveURL(/\/projects\/new/);
  });
});

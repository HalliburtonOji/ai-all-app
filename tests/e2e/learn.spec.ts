import { test, expect } from "./auth-fixture";
import { signUpNewUser } from "./helpers";

const FIRST_LESSON_SLUG = "foundations-01-what-is-ai";
const FIRST_LESSON_TITLE = "What's actually in the AI box";

/**
 * Each test signs up fresh — lesson progress is user-scoped, so tests
 * shouldn't share state. Same pattern as earnings.spec.
 */
test.describe("Phase 5 — Learn v1", () => {
  test("catalog shows both branches and lesson cards", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUpNewUser(page);

    await page.goto("/learn");
    await expect(
      page.getByRole("heading", { name: /Get genuinely good at AI/ }),
    ).toBeVisible();

    // Both branches present.
    await expect(
      page.locator('[data-learn-branch="foundations"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-learn-branch="prompt-craft"]'),
    ).toBeVisible();

    // First lesson card is reachable.
    const firstLessonCard = page.locator(
      `[data-lesson-slug="${FIRST_LESSON_SLUG}"]`,
    );
    await expect(firstLessonCard).toBeVisible();
    await expect(firstLessonCard).toHaveAttribute(
      "data-lesson-status",
      "unstarted",
    );

    // Progress summary at top reads "0 of N".
    await expect(
      page.locator('[data-learn-progress-summary="true"]'),
    ).toContainText(/0 of \d+ lessons/);

    await ctx.close();
  });

  test("opening a lesson auto-marks it as started", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUpNewUser(page);

    await page.goto(`/learn/${FIRST_LESSON_SLUG}`);
    await expect(
      page.getByRole("heading", { name: FIRST_LESSON_TITLE }),
    ).toBeVisible();

    // Status card defaults to 'started' on first view.
    const statusCard = page.locator('[data-lesson-status-card="true"]');
    await expect(statusCard).toHaveAttribute("data-lesson-status", "started");

    // Catalog now reflects "in progress".
    await page.goto("/learn");
    const card = page.locator(`[data-lesson-slug="${FIRST_LESSON_SLUG}"]`);
    await expect(card).toHaveAttribute("data-lesson-status", "started");
    await expect(
      card.locator('[data-lesson-badge="started"]'),
    ).toBeVisible();

    await ctx.close();
  });

  test("mark complete + toggle back to in-progress, persists across reload", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUpNewUser(page);

    await page.goto(`/learn/${FIRST_LESSON_SLUG}`);

    // Mark complete.
    await page.locator('[data-lesson-toggle-complete="true"]').click();
    const card = page.locator('[data-lesson-status-card="true"]');
    await expect(card).toHaveAttribute(
      "data-lesson-status",
      "completed",
      { timeout: 10_000 },
    );

    // Persist after reload.
    await page.reload();
    await expect(card).toHaveAttribute("data-lesson-status", "completed");

    // Catalog page reflects the win.
    await page.goto("/learn");
    await expect(
      page.locator(`[data-lesson-slug="${FIRST_LESSON_SLUG}"]`),
    ).toHaveAttribute("data-lesson-status", "completed");
    await expect(
      page.locator('[data-learn-progress-summary="true"]'),
    ).toContainText(/1 of \d+ lessons complete/);

    // Toggle back.
    await page.goto(`/learn/${FIRST_LESSON_SLUG}`);
    await page.locator('[data-lesson-toggle-complete="true"]').click();
    await expect(card).toHaveAttribute(
      "data-lesson-status",
      "started",
      { timeout: 10_000 },
    );

    await ctx.close();
  });

  test("tutor mode answers with lesson context (mock-mode marker)", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUpNewUser(page);

    await page.goto(`/learn/${FIRST_LESSON_SLUG}`);
    await expect(page.locator('[data-lesson-tutor="true"]')).toBeVisible();

    await page
      .locator('[data-lesson-tutor-input="true"]')
      .fill("Why does this matter for me?");
    await page.locator('[data-lesson-tutor-submit="true"]').click();

    const reply = page.locator('[data-lesson-tutor-reply="true"]');
    await expect(reply).toBeVisible({ timeout: 10_000 });
    // Mock marker proves we hit the tutor route + lesson context was injected.
    await expect(reply).toContainText("[mock-tutor]");
    await expect(reply).toContainText(FIRST_LESSON_TITLE);

    await ctx.close();
  });

  test("non-existent lesson slug returns 404", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUpNewUser(page);

    const response = await page.goto("/learn/nonexistent-lesson-slug-zzz");
    expect(response?.status()).toBe(404);

    await ctx.close();
  });

  test("dashboard suggests Lesson 1 to a user with zero progress", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUpNewUser(page);

    // Fresh user lands on dashboard automatically — assert the suggestion.
    await expect(
      page.locator('[data-dashboard-suggested-lesson="true"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-dashboard-suggested-lesson-link="true"]'),
    ).toHaveAttribute("href", `/learn/${FIRST_LESSON_SLUG}`);

    // Once a lesson is opened (auto-started), the suggestion should disappear.
    await page.goto(`/learn/${FIRST_LESSON_SLUG}`);
    await expect(
      page.getByRole("heading", { name: FIRST_LESSON_TITLE }),
    ).toBeVisible();
    await page.goto("/dashboard");
    await expect(
      page.locator('[data-dashboard-suggested-lesson="true"]'),
    ).toHaveCount(0);

    await ctx.close();
  });

  test("tutor endpoint returns 401 to unauthenticated callers", async ({
    playwright,
  }) => {
    const ctx = await playwright.request.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const response = await ctx.post("/api/learn/tutor", {
      data: { lessonSlug: FIRST_LESSON_SLUG, question: "hi" },
    });
    expect(response.status()).toBe(401);
    await ctx.dispose();
  });
});

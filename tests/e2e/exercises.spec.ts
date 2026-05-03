import { test, expect } from "./auth-fixture";

test.describe("Phase 15 — Lesson exercises with feedback", () => {
  test("lesson with rubric shows exercise form + grades the attempt", async ({
    page,
  }) => {
    // prompt-craft-01-clear-asks has try_it_rubric set.
    await page.goto("/learn/prompt-craft-01-clear-asks");
    await expect(
      page.locator('[data-lesson-exercise="true"]'),
    ).toBeVisible();

    await page
      .locator('[data-lesson-exercise-input="true"]')
      .fill(
        "I'm a freelance designer pitching a small clinic. Draft a 3-paragraph cold email asking if they want a brand refresh, friendly but direct, ≤180 words. My portfolio: portfolio.example.",
      );
    await page.locator('[data-lesson-exercise-submit="true"]').click();

    const reply = page.locator('[data-lesson-exercise-reply="true"]');
    await expect(reply).toBeVisible({ timeout: 10_000 });
    // Mock-mode marker confirms wiring + lesson title injection.
    await expect(reply).toContainText("[mock-exercise]");
    await expect(reply).toContainText("Asking clearly");
  });

  test("lesson without rubric does not show the exercise form", async ({
    page,
  }) => {
    // foundations-01-what-is-ai has no try_it_rubric.
    await page.goto("/learn/foundations-01-what-is-ai");
    await expect(
      page.getByRole("heading", { name: /What's actually in the AI box/ }),
    ).toBeVisible();
    await expect(
      page.locator('[data-lesson-exercise="true"]'),
    ).toHaveCount(0);
  });

  test("/api/learn/exercise rejects unauthenticated callers", async ({
    playwright,
  }) => {
    const ctx = await playwright.request.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const response = await ctx.post("/api/learn/exercise", {
      data: {
        lessonSlug: "prompt-craft-01-clear-asks",
        attempt: "anything",
      },
    });
    expect(response.status()).toBe(401);
    await ctx.dispose();
  });
});

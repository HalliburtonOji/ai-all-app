import { test, expect } from "@playwright/test";
import { createProject, signUpNewUser } from "./helpers";

const COACH_PLACEHOLDER = "Ask the coach anything…";

test.describe("User-level memory (cross-project)", () => {
  test("a user fact can be edited and the change persists", async ({
    page,
  }) => {
    await signUpNewUser(page);
    await page.goto("/dashboard");

    // Trigger one mock user-fact extraction
    await page.locator('[data-extract-user-facts-button="true"]').click();
    const factItem = page.locator("[data-user-fact-id]").first();
    await expect(factItem).toBeVisible({ timeout: 10_000 });

    await factItem.hover();
    await factItem.getByRole("button", { name: "Edit user fact" }).click();

    const editor = page.getByRole("textbox", { name: "Edit user fact text" });
    await expect(editor).toBeVisible();
    await editor.fill("Lives in London, prefers concise prose");
    await page.getByRole("button", { name: "Save", exact: true }).click();

    await expect(
      page.getByText("Lives in London, prefers concise prose").first(),
    ).toBeVisible({ timeout: 5_000 });

    await page.reload();
    await expect(
      page.getByText("Lives in London, prefers concise prose").first(),
    ).toBeVisible();
  });

  test("a user fact can be deleted with confirmation", async ({ page }) => {
    await signUpNewUser(page);
    await page.goto("/dashboard");

    await page.locator('[data-extract-user-facts-button="true"]').click();
    const factItem = page.locator("[data-user-fact-id]").first();
    await expect(factItem).toBeVisible({ timeout: 10_000 });

    const factText = (await factItem.locator("p").first().innerText()).trim();

    await factItem.hover();
    await factItem.getByRole("button", { name: "Delete user fact" }).click();
    await page
      .getByRole("button", { name: "Yes, delete", exact: true })
      .click();

    // Wait for the row to actually disappear from the DOM (server action
    // committed + revalidation re-rendered), not just the text to be hidden
    // by confirmDelete mode.
    await expect(page.locator("[data-user-fact-id]")).toHaveCount(0, {
      timeout: 10_000,
    });
    await page.reload();
    await expect(page.getByText(factText)).toHaveCount(0);
  });

  test("a user fact can be pinned and sorts to the top", async ({ page }) => {
    await signUpNewUser(page);
    await page.goto("/dashboard");

    const extractBtn = page.locator('[data-extract-user-facts-button="true"]');

    await extractBtn.click();
    await expect(page.locator("[data-user-fact-id]")).toHaveCount(1, {
      timeout: 10_000,
    });
    await expect(extractBtn).toBeEnabled({ timeout: 10_000 });

    await page.waitForTimeout(50);

    await extractBtn.click();
    await expect(page.locator("[data-user-fact-id]")).toHaveCount(2, {
      timeout: 10_000,
    });

    const olderFact = page.locator("[data-user-fact-id]").nth(1);
    const olderFactId = await olderFact.getAttribute("data-user-fact-id");
    expect(olderFactId).toBeTruthy();

    await olderFact.hover();
    await olderFact.getByRole("button", { name: "Pin user fact" }).click();

    const topFact = page.locator("[data-user-fact-id]").first();
    await expect(topFact).toHaveAttribute(
      "data-user-fact-id",
      olderFactId!,
    );
    await expect(topFact).toHaveAttribute("data-pinned", "true");
  });

  test("RLS: User B's dashboard does not show User A's user facts", async ({
    browser,
  }) => {
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await signUpNewUser(pageA);
    await pageA.goto("/dashboard");
    await pageA.locator('[data-extract-user-facts-button="true"]').click();
    await expect(pageA.locator("[data-user-fact-id]").first()).toBeVisible({
      timeout: 10_000,
    });
    const factText = (
      await pageA
        .locator("[data-user-fact-id] p")
        .first()
        .innerText()
    ).trim();
    await ctxA.close();

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await signUpNewUser(pageB);
    await pageB.goto("/dashboard");

    // The About you panel should be present (empty state) but NOT show A's fact.
    await expect(
      pageB.locator('[data-user-memory-panel="true"]'),
    ).toBeVisible();
    await expect(pageB.getByText(factText)).toHaveCount(0);

    await ctxB.close();
  });

  test("user facts are injected into the coach system prompt", async ({
    page,
  }) => {
    await signUpNewUser(page);

    // Create the project FIRST so user has a project (required for the
    // dashboard's About you panel to populate after extraction; the mock
    // extraction picks the user's most-recent project as source attribution).
    await createProject(page, {
      name: "User memory injection test",
      type: "channel",
    });

    // Now go to dashboard and trigger user-fact extraction
    await page.goto("/dashboard");
    await page.locator('[data-extract-user-facts-button="true"]').click();
    await expect(page.locator("[data-user-fact-id]")).toHaveCount(1, {
      timeout: 10_000,
    });

    // Open the project we created and send a message — mock should include
    // `[user-memory: 1]` confirming injection.
    await page.getByRole("link", { name: /User memory injection test/ }).click();
    await page.waitForURL(/\/projects\/[a-f0-9-]+/);

    await page
      .getByPlaceholder(COACH_PLACEHOLDER)
      .fill("test user-memory injection");
    await page.getByRole("button", { name: "Send", exact: true }).click();

    await expect(page.getByText(/\[user-memory: 1\]/).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("user facts cap at 100; oldest non-pinned dropped on overflow", async ({
    page,
  }) => {
    // Stress test (101 sequential server actions). Reliable locally,
    // exceeds the test budget on Linux CI under parallel-worker
    // contention. Skipped in CI; run before each release locally.
    test.skip(
      !!process.env.CI,
      "Stress test — runs locally only. Cap eviction is well-defined; low regression risk.",
    );
    test.setTimeout(240_000);

    await signUpNewUser(page);
    await page.goto("/dashboard");

    const extractBtn = page.locator('[data-extract-user-facts-button="true"]');
    for (let i = 0; i < 101; i++) {
      await extractBtn.click();
      // 20s per click absorbs Linux-CI jitter; locally each click resolves
      // in well under 1s. 101 clicks × ~500ms = ~50s, well under the
      // 3-min test budget set above.
      await expect(extractBtn).toBeEnabled({ timeout: 20_000 });
    }

    await page.reload();
    await expect(page.locator("[data-user-fact-id]")).toHaveCount(100, {
      timeout: 10_000,
    });
  });
});

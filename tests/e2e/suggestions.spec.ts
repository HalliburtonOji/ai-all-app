import { test, expect } from "./auth-fixture";
import { createProject, signUpNewUser } from "./helpers";

const COACH_PLACEHOLDER = "Ask the coach anything…";

test.describe("Coach suggestions tray", () => {
  test("suggestions appear after the first assistant response", async ({
    page,
  }) => {
    await createProject(page, { name: "Suggestions test", type: "channel" });

    // Tray should be hidden in a fresh, empty thread.
    await expect(
      page.locator('[data-suggestion-tray="true"]'),
    ).toHaveCount(0);

    // Send first message — after the stream completes, the tray should
    // populate with the 3 deterministic mock suggestions.
    await page
      .getByPlaceholder(COACH_PLACEHOLDER)
      .fill("hello suggestions");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await expect(
      page.getByText(/\[mock\] I received: hello suggestions/),
    ).toBeVisible({ timeout: 10_000 });

    const tray = page.locator('[data-suggestion-tray="true"]');
    await expect(tray).toBeVisible({ timeout: 10_000 });
    await expect(tray.locator("[data-suggestion-index]")).toHaveCount(3);
  });

  test("clicking a suggestion fills the input but does not auto-send", async ({
    page,
  }) => {
    await createProject(page, {
      name: "Suggestion click test",
      type: "exploration",
    });

    await page
      .getByPlaceholder(COACH_PLACEHOLDER)
      .fill("trigger suggestions");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await expect(
      page.getByText(/\[mock\] I received: trigger suggestions/),
    ).toBeVisible({ timeout: 10_000 });

    // Wait for the tray to populate.
    const firstPill = page
      .locator('[data-suggestion-tray="true"] [data-suggestion-index="0"]')
      .first();
    await expect(firstPill).toBeVisible({ timeout: 10_000 });

    const pillLabel = (await firstPill.innerText()).trim();
    expect(pillLabel.length).toBeGreaterThan(0);

    await firstPill.click();

    // Input should now contain a prompt (the mock prompt, not the label).
    const textarea = page.getByPlaceholder(COACH_PLACEHOLDER);
    await expect(textarea).toBeFocused();
    const value = await textarea.inputValue();
    expect(value.length).toBeGreaterThan(0);

    // Critically: not auto-sent. The same content the click filled in is
    // still sitting in the textarea; no new user message has been posted
    // beyond the original "trigger suggestions".
    const userMessages = page.locator('[data-message-role="user"]');
    await expect(userMessages).toHaveCount(1);
  });

  test("fresh empty thread shows no suggestion tray", async ({ page }) => {
    await createProject(page, { name: "Empty thread test", type: "channel" });

    // No messages yet → no tray.
    await expect(
      page.locator('[data-suggestion-tray="true"]'),
    ).toHaveCount(0);
  });

  test("RLS: User B cannot fetch suggestions for User A's conversation", async ({
    browser,
  }) => {
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await signUpNewUser(pageA);
    await createProject(pageA, {
      name: "Suggestion RLS test",
      type: "channel",
    });

    const conversationIdA = await pageA
      .locator("[data-conversation-id]")
      .first()
      .getAttribute("data-conversation-id");
    expect(conversationIdA).toBeTruthy();
    await ctxA.close();

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await signUpNewUser(pageB);

    const res = await pageB.request.post("/api/coach/suggest", {
      data: { conversationId: conversationIdA },
    });
    expect(res.status()).toBe(404);

    await ctxB.close();
  });
});

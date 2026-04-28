import { test, expect } from "@playwright/test";
import { createProject, signUpNewUser } from "./helpers";

const COACH_PLACEHOLDER = "Ask the coach anything…";

test.describe("Coach", () => {
  test("user can send a message and see an assistant response", async ({
    page,
  }) => {
    await signUpNewUser(page);
    await createProject(page, { name: "Coach happy path", type: "channel" });

    await expect(page.getByPlaceholder(COACH_PLACEHOLDER)).toBeVisible();

    await page.getByPlaceholder(COACH_PLACEHOLDER).fill("Help me brainstorm");
    await page.getByRole("button", { name: "Send", exact: true }).click();

    // User message appears
    await expect(page.getByText("Help me brainstorm").first()).toBeVisible({
      timeout: 10_000,
    });

    // Mock assistant response (deterministic in test mode)
    await expect(
      page.getByText(/\[mock\] I received: Help me brainstorm/),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("messages persist across a full page refresh", async ({ page }) => {
    await signUpNewUser(page);
    await createProject(page, {
      name: "Coach persistence",
      type: "exploration",
    });

    await page
      .getByPlaceholder(COACH_PLACEHOLDER)
      .fill("This message should persist");
    await page.getByRole("button", { name: "Send", exact: true }).click();

    await expect(
      page.getByText(/\[mock\] I received: This message should persist/),
    ).toBeVisible({ timeout: 10_000 });

    await page.reload();

    await expect(
      page.getByText("This message should persist").first(),
    ).toBeVisible();
    await expect(
      page.getByText(/\[mock\] I received: This message should persist/),
    ).toBeVisible();
  });

  test("logged-out user calling /api/coach gets 401", async ({ request }) => {
    const res = await request.post("/api/coach", {
      data: {
        conversationId: "00000000-0000-0000-0000-000000000000",
        message: "test",
      },
    });
    expect(res.status()).toBe(401);
  });

  test("very long message (>10,000 chars) is rejected with a clear error", async ({
    page,
  }) => {
    await signUpNewUser(page);
    await createProject(page, { name: "Coach validation", type: "sandbox" });

    const longMessage = "a".repeat(10_001);
    await page.getByPlaceholder(COACH_PLACEHOLDER).fill(longMessage);
    await page.getByRole("button", { name: "Send", exact: true }).click();

    await expect(page.getByText(/10,000 characters/i)).toBeVisible({
      timeout: 5_000,
    });
  });

  test("RLS: User B cannot access User A's coach conversation via direct API", async ({
    browser,
  }) => {
    // ---- User A creates a project + sends a message ----
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await signUpNewUser(pageA);
    await createProject(pageA, {
      name: "User A private project",
      type: "channel",
    });

    await pageA
      .getByPlaceholder(COACH_PLACEHOLDER)
      .fill("Secret message from A");
    await pageA.getByRole("button", { name: "Send", exact: true }).click();
    await expect(
      pageA.getByText(/\[mock\] I received: Secret message from A/),
    ).toBeVisible({ timeout: 10_000 });

    // Capture A's conversation ID from the data attribute
    const conversationIdA = await pageA
      .locator("[data-conversation-id]")
      .first()
      .getAttribute("data-conversation-id");
    expect(conversationIdA).toBeTruthy();

    await ctxA.close();

    // ---- User B logs in as a different user ----
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await signUpNewUser(pageB);

    // Direct API call: B tries to POST a message into A's conversation.
    // Should be rejected because RLS hides A's conversation from B's queries.
    const res = await pageB.request.post("/api/coach", {
      data: {
        conversationId: conversationIdA,
        message: "intrusion attempt",
      },
    });
    expect(res.status()).toBe(404);

    await ctxB.close();
  });
});

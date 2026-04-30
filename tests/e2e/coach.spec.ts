import { test, expect } from "./auth-fixture";
import { createProject, signUpNewUser } from "./helpers";

const COACH_PLACEHOLDER = "Ask the coach anything…";

test.describe("Coach", () => {
  test("user can send a message and see an assistant response", async ({
    page,
  }) => {
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

  test("logged-out user calling /api/coach gets 401", async ({
    playwright,
  }) => {
    // Worker fixture provides auth cookies by default; for this test we
    // need a cookie-less request context to verify the unauthenticated
    // path actually returns 401 (instead of 404 for a missing
    // conversation under the worker's user).
    const ctx = await playwright.request.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const res = await ctx.post("/api/coach", {
      data: {
        conversationId: "00000000-0000-0000-0000-000000000000",
        message: "test",
      },
    });
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });

  test("very long message (>10,000 chars) is rejected with a clear error", async ({
    page,
  }) => {
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

test.describe("Coach Part 2 — streaming + multi-thread", () => {
  test("response streams in (data-streaming flips true → false)", async ({
    page,
  }) => {
    await createProject(page, { name: "Streaming test", type: "channel" });

    await page
      .getByPlaceholder(COACH_PLACEHOLDER)
      .fill("test stream please");
    await page.getByRole("button", { name: "Send", exact: true }).click();

    // While the stream is in progress, an assistant bubble with
    // data-streaming="true" must exist in the DOM. That proves the
    // SSE consumer is observing the stream's open state, not just the
    // final result.
    const streamingBubble = page.locator(
      '[data-message-role="assistant"][data-streaming="true"]',
    );
    await expect(streamingBubble).toHaveCount(1, { timeout: 5_000 });

    // Stream eventually ends — the streaming-true bubble disappears.
    await expect(streamingBubble).toHaveCount(0, { timeout: 15_000 });

    // Final mocked content is visible.
    await expect(
      page
        .getByText(/\[mock\] I received: test stream please/)
        .first(),
    ).toBeVisible();
  });

  test("threads have independent message histories", async ({ page }) => {
    await createProject(page, {
      name: "Multi-thread test",
      type: "exploration",
    });

    // Capture thread A's id (auto-created on first project visit).
    const conversationAId = await page
      .locator("[data-conversation-id]")
      .first()
      .getAttribute("data-conversation-id");
    expect(conversationAId).toBeTruthy();

    // Send in A
    await page
      .getByPlaceholder(COACH_PLACEHOLDER)
      .fill("Alpha message in thread A");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await expect(
      page.getByText(/\[mock\] I received: Alpha message in thread A/),
    ).toBeVisible({ timeout: 10_000 });

    // Create thread B
    await page
      .getByRole("button", { name: "+ New conversation" })
      .first()
      .click();
    await page.waitForURL(/\?conversation=[a-f0-9-]+/);
    const conversationBId = await page
      .locator("[data-conversation-id]")
      .first()
      .getAttribute("data-conversation-id");
    expect(conversationBId).toBeTruthy();
    expect(conversationBId).not.toBe(conversationAId);

    // Empty state in B
    await expect(
      page.getByText(/Ready when you are\. What's on your mind\?/),
    ).toBeVisible();

    // Send in B
    await page
      .getByPlaceholder(COACH_PLACEHOLDER)
      .fill("Beta message in thread B");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await expect(
      page.getByText(/\[mock\] I received: Beta message in thread B/),
    ).toBeVisible({ timeout: 10_000 });

    // Alpha not visible in B's history
    await expect(page.getByText("Alpha message in thread A")).toHaveCount(0);

    // Switch back to A via sidebar link
    await page
      .locator(`a[href*="conversation=${conversationAId}"]`)
      .first()
      .click();
    await page.waitForURL(new RegExp(`conversation=${conversationAId}`));

    // A's content visible, B's not
    await expect(
      page.getByText("Alpha message in thread A").first(),
    ).toBeVisible();
    await expect(page.getByText("Beta message in thread B")).toHaveCount(0);
  });

  test("RLS: User B cannot post to User A's thread via /api/coach/stream", async ({
    browser,
  }) => {
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await signUpNewUser(pageA);
    await createProject(pageA, {
      name: "Stream RLS test",
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

    const res = await pageB.request.post("/api/coach/stream", {
      data: {
        conversationId: conversationIdA,
        message: "intrusion attempt via stream",
      },
    });
    expect(res.status()).toBe(404);

    await ctxB.close();
  });

  test("rename thread persists across refresh", async ({ page }) => {
    await createProject(page, { name: "Rename test", type: "exploration" });

    // Send a message so the conversation has content (and an auto-title)
    await page.getByPlaceholder(COACH_PLACEHOLDER).fill("hello rename");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await expect(
      page.getByText(/\[mock\] I received: hello rename/),
    ).toBeVisible({ timeout: 10_000 });

    // Click Rename in the sidebar item
    await page
      .getByRole("button", { name: "Rename conversation" })
      .first()
      .click();

    // Edit the title and submit via Enter
    const titleInput = page.getByRole("textbox", {
      name: "New conversation title",
    });
    await expect(titleInput).toBeVisible();
    await titleInput.fill("My Custom Title");
    await titleInput.press("Enter");

    // New title visible in sidebar
    await expect(page.getByText("My Custom Title").first()).toBeVisible({
      timeout: 5_000,
    });

    // Persist across reload
    await page.reload();
    await expect(page.getByText("My Custom Title").first()).toBeVisible();
  });

  test("delete thread removes it from the sidebar", async ({ page }) => {
    await createProject(page, { name: "Delete test", type: "sandbox" });

    // Title the auto-created conversation by sending a message.
    await page.getByPlaceholder(COACH_PLACEHOLDER).fill("first thread");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await expect(
      page.getByText(/\[mock\] I received: first thread/),
    ).toBeVisible({ timeout: 10_000 });

    // Create thread B
    await page
      .getByRole("button", { name: "+ New conversation" })
      .first()
      .click();
    await page.waitForURL(/\?conversation=/);

    // Send in B
    await page.getByPlaceholder(COACH_PLACEHOLDER).fill("second thread");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await expect(
      page.getByText(/\[mock\] I received: second thread/),
    ).toBeVisible({ timeout: 10_000 });

    // Delete the current thread (B)
    await page
      .getByRole("button", { name: "Delete conversation" })
      .first()
      .click();
    await page.getByRole("button", { name: "Yes, delete", exact: true }).click();

    // After deletion, the page redirects to /projects/<id> and lands on A.
    await page.waitForURL(/\/projects\/[a-f0-9-]+(\?|$)/);

    // B's content is gone; A's content is visible.
    await expect(page.getByText("second thread")).toHaveCount(0);
    await expect(page.getByText("first thread").first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test("auto-title fires after first message in a new thread", async ({
    page,
  }) => {
    await createProject(page, { name: "Auto-title test", type: "channel" });

    // Initially the auto-created conversation shows the default title.
    // We match by the link's accessible name to avoid colliding with
    // the "+ New conversation" button text.
    await expect(
      page.getByRole("link", { name: /^New conversation/ }).first(),
    ).toBeVisible();

    // Send a first message — mock auto-title becomes "Mock: <first 3 words>".
    await page
      .getByPlaceholder(COACH_PLACEHOLDER)
      .fill("brainstorm channel ideas for me");
    await page.getByRole("button", { name: "Send", exact: true }).click();

    await expect(
      page.getByText(
        /\[mock\] I received: brainstorm channel ideas for me/,
      ),
    ).toBeVisible({ timeout: 10_000 });

    // After the stream completes, the sidebar title updates to the mock auto-title.
    await expect(
      page.getByText(/Mock: brainstorm channel ideas/).first(),
    ).toBeVisible({ timeout: 8_000 });
  });

  test("regenerate replaces the assistant response (no duplicate turns)", async ({
    page,
  }) => {
    await createProject(page, { name: "Regenerate test", type: "channel" });

    await page
      .getByPlaceholder(COACH_PLACEHOLDER)
      .fill("hello regenerate me");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await expect(
      page.getByText(/\[mock\] I received: hello regenerate me/),
    ).toBeVisible({ timeout: 10_000 });

    // Initial state: 1 user + 1 assistant.
    await expect(
      page.locator('[data-message-role="user"]'),
    ).toHaveCount(1);
    await expect(
      page.locator('[data-message-role="assistant"]'),
    ).toHaveCount(1);

    // Click Regenerate on the assistant message.
    await page
      .getByRole("button", { name: "Regenerate response" })
      .first()
      .click();

    // After regeneration the stream replays. We end up with exactly 1 user + 1 assistant
    // (the previous turn was deleted from the DB by regenerateLastResponse).
    const streamingBubble = page.locator(
      '[data-message-role="assistant"][data-streaming="true"]',
    );
    await expect(streamingBubble).toHaveCount(0, { timeout: 15_000 });
    await expect(
      page.getByText(/\[mock\] I received: hello regenerate me/),
    ).toBeVisible();
    await expect(
      page.locator('[data-message-role="user"]'),
    ).toHaveCount(1);
    await expect(
      page.locator('[data-message-role="assistant"]'),
    ).toHaveCount(1);

    // Refresh — DB also reflects exactly 1 turn.
    await page.reload();
    await expect(
      page.locator('[data-message-role="user"]'),
    ).toHaveCount(1);
    await expect(
      page.locator('[data-message-role="assistant"]'),
    ).toHaveCount(1);
  });

  test("input is disabled while a stream is in progress", async ({ page }) => {
    await createProject(page, { name: "Input disable test", type: "channel" });

    const textarea = page.getByPlaceholder(COACH_PLACEHOLDER);
    await expect(textarea).toBeEnabled();

    await textarea.fill("disable check");
    await page.getByRole("button", { name: "Send", exact: true }).click();

    // Disabled while streaming.
    await expect(textarea).toBeDisabled();

    // Wait for stream to complete and verify re-enabled.
    await expect(
      page.getByText(/\[mock\] I received: disable check/),
    ).toBeVisible({ timeout: 10_000 });
    await expect(textarea).toBeEnabled();
  });
});

import { test, expect } from "./auth-fixture";
import { createProject, signUpNewUser } from "./helpers";

const TEST_KEY_VALUE = "sk-ant-test-fake-1234567890ABCD";
const TEST_KEY_TAIL = "ABCD";

test.describe("Phase 7 — BYOK (bring your own keys)", () => {
  test("save an Anthropic key + redacted display + persists across reload", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUpNewUser(page);

    await page.goto("/me/keys");
    await expect(
      page.getByRole("heading", { name: /Your API keys/ }),
    ).toBeVisible();

    const card = page.locator('[data-byok-card="anthropic"]');
    await expect(card).toHaveAttribute("data-byok-has-key", "false");

    await card
      .locator('[data-byok-input="anthropic"]')
      .fill(TEST_KEY_VALUE);
    await card
      .locator('[data-byok-label-input="anthropic"]')
      .fill("Personal");
    await card.locator('[data-byok-save="anthropic"]').click();

    await expect(card).toHaveAttribute(
      "data-byok-has-key",
      "true",
      { timeout: 10_000 },
    );
    const redacted = card.locator('[data-byok-redacted="anthropic"]');
    await expect(redacted).toBeVisible();
    // Redaction should show last 4 chars + the recognizable prefix.
    await expect(redacted).toContainText(TEST_KEY_TAIL);
    // The plaintext middle of the key MUST NOT appear anywhere.
    await expect(redacted).not.toContainText("test-fake-1234567890");

    await page.reload();
    await expect(
      page.locator('[data-byok-card="anthropic"]'),
    ).toHaveAttribute("data-byok-has-key", "true");
    await expect(
      page.locator('[data-byok-redacted="anthropic"]'),
    ).toContainText(TEST_KEY_TAIL);

    await ctx.close();
  });

  test("coach mock surfaces [byok] marker once user has an Anthropic key", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUpNewUser(page);

    // Without a key, the standard mock response — no [byok] marker.
    const projectId = await createProject(page, {
      name: "BYOK marker test",
      type: "channel",
    });
    await page
      .getByPlaceholder("Ask the coach anything…")
      .fill("Hello before BYOK");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await expect(
      page.getByText(/\[mock\] I received: Hello before BYOK/),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/\[byok\]/)).toHaveCount(0);

    // Now save a key.
    await page.goto("/me/keys");
    await page
      .locator('[data-byok-card="anthropic"]')
      .locator('[data-byok-input="anthropic"]')
      .fill(TEST_KEY_VALUE);
    await page
      .locator('[data-byok-card="anthropic"]')
      .locator('[data-byok-save="anthropic"]')
      .click();
    await expect(
      page.locator('[data-byok-card="anthropic"]'),
    ).toHaveAttribute("data-byok-has-key", "true", { timeout: 10_000 });

    // Send another coach message — the [byok] marker should now appear.
    await page.goto(`/projects/${projectId}`);
    await page
      .getByPlaceholder("Ask the coach anything…")
      .fill("Hello after BYOK");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await expect(
      page.getByText(/\[mock\] I received: Hello after BYOK.*\[byok\]/),
    ).toBeVisible({ timeout: 10_000 });

    await ctx.close();
  });

  test("delete a saved key reverts to platform-key state", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUpNewUser(page);

    await page.goto("/me/keys");
    const card = page.locator('[data-byok-card="anthropic"]');
    await card
      .locator('[data-byok-input="anthropic"]')
      .fill(TEST_KEY_VALUE);
    await card.locator('[data-byok-save="anthropic"]').click();
    await expect(card).toHaveAttribute(
      "data-byok-has-key",
      "true",
      { timeout: 10_000 },
    );

    await card.locator('[data-byok-delete="anthropic"]').click();
    await card.locator('[data-byok-confirm-delete="anthropic"]').click();
    await expect(card).toHaveAttribute(
      "data-byok-has-key",
      "false",
      { timeout: 10_000 },
    );

    await page.reload();
    await expect(
      page.locator('[data-byok-card="anthropic"]'),
    ).toHaveAttribute("data-byok-has-key", "false");

    await ctx.close();
  });

  test("RLS: user B cannot see user A's saved keys", async ({ browser }) => {
    // User A saves a key.
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await signUpNewUser(pageA);
    await pageA.goto("/me/keys");
    await pageA
      .locator('[data-byok-card="anthropic"]')
      .locator('[data-byok-input="anthropic"]')
      .fill(TEST_KEY_VALUE);
    await pageA
      .locator('[data-byok-card="anthropic"]')
      .locator('[data-byok-save="anthropic"]')
      .click();
    await expect(
      pageA.locator('[data-byok-card="anthropic"]'),
    ).toHaveAttribute("data-byok-has-key", "true", { timeout: 10_000 });
    await ctxA.close();

    // User B sees an unset state.
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await signUpNewUser(pageB);
    await pageB.goto("/me/keys");
    await expect(
      pageB.locator('[data-byok-card="anthropic"]'),
    ).toHaveAttribute("data-byok-has-key", "false");
    // Redacted block is absent for user B.
    await expect(
      pageB.locator('[data-byok-redacted="anthropic"]'),
    ).toHaveCount(0);
    await ctxB.close();
  });

  test("/me/keys redirects unauthenticated viewers to /login", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const page = await ctx.newPage();
    await page.goto("/me/keys");
    expect(page.url()).toContain("/login");
    await ctx.close();
  });
});

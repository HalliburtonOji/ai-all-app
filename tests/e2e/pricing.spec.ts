import { test, expect } from "./auth-fixture";
import { createProject } from "./helpers";

const COACH_PLACEHOLDER = "Ask the coach anything…";

test.describe("Phase 4c — pricing helper", () => {
  test("refuses pricing question when project has no memory context", async ({
    page,
  }) => {
    await createProject(page, {
      name: "Pricing — no context",
      type: "client",
    });

    await page
      .getByPlaceholder(COACH_PLACEHOLDER)
      .fill("What should I charge for this work?");
    await page.getByRole("button", { name: "Send", exact: true }).click();

    // Refusal branch fires when there are zero project_facts AND zero
    // user_facts.
    await expect(
      page.getByText(/\[mock\] \[pricing-refusal\]/),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText(/I'd need more context to suggest a price/),
    ).toBeVisible();
    // The "[pricing]" with-context marker must NOT have fired.
    await expect(page.getByText(/\[mock\] \[pricing\]/)).toHaveCount(0);
  });

  test("gives a range with caveat when project memory exists", async ({
    page,
  }) => {
    await createProject(page, {
      name: "Pricing — with context",
      type: "client",
    });

    // Seed a project_fact via the admin extract button (always exposed
    // in test mode).
    await page.getByRole("link", { name: /^Memory/ }).click();
    await page.waitForURL(/tab=memory/);
    await page.locator('[data-extract-button="true"]').click();
    await expect(page.locator("[data-fact-id]").first()).toBeVisible({
      timeout: 10_000,
    });

    // Back to coach, ask the pricing question.
    await page.getByRole("link", { name: /^Coach/ }).click();
    await page.waitForURL(/\/projects\/[a-f0-9-]+(?:\?.*)?$/);

    await page
      .getByPlaceholder(COACH_PLACEHOLDER)
      .fill("How much should I charge for this?");
    await page.getByRole("button", { name: "Send", exact: true }).click();

    // With-context branch — includes the [pricing] marker, a range
    // hint, and the caveat.
    await expect(page.getByText(/\[mock\] \[pricing\]/)).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.getByText(/Caveat: pricing depends on factors/),
    ).toBeVisible();
    // Refusal branch must NOT have fired.
    await expect(
      page.getByText(/\[mock\] \[pricing-refusal\]/),
    ).toHaveCount(0);
  });

  test("non-pricing words don't trigger the pricing branch", async ({
    page,
  }) => {
    await createProject(page, {
      name: "Non-pricing message",
      type: "channel",
    });

    await page
      .getByPlaceholder(COACH_PLACEHOLDER)
      .fill("Help me brainstorm content ideas");
    await page.getByRole("button", { name: "Send", exact: true }).click();

    // Goes through the chatty mock branch, not pricing.
    await expect(
      page.getByText(/\[mock\] I received: Help me brainstorm/),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/\[pricing/)).toHaveCount(0);
  });
});

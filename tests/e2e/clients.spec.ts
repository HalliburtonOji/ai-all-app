import { test, expect } from "./auth-fixture";
import { signUpNewUser } from "./helpers";

/**
 * Phase 9 — Client CRM v1.
 * Each test signs up a fresh user — clients are user-scoped.
 */

test.describe("Phase 9 — Client CRM", () => {
  test("add a client, see it in the roster, status sections render", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUpNewUser(page);

    await page.goto("/me/clients");
    await expect(
      page.getByRole("heading", { name: /Your client roster/ }),
    ).toBeVisible();
    await expect(page.locator('[data-clients-empty="true"]')).toBeVisible();

    await page.locator('[data-clients-new-button="true"]').click();
    await page.waitForURL(/\/me\/clients\/new$/);

    await page.locator('[data-client-input="name"]').fill("Acme Co.");
    await page
      .locator('[data-client-input="email"]')
      .fill("contact@acme.example");
    await page.locator('[data-client-input="company"]').fill("Acme Corp");
    await page.locator('[data-client-submit="create"]').click();

    // Lands on client detail.
    await page.waitForURL(/\/me\/clients\/[a-f0-9-]+$/, { timeout: 10_000 });
    await expect(
      page.getByRole("heading", { name: "Acme Co." }),
    ).toBeVisible();

    // Visible in the roster, under "active".
    await page.goto("/me/clients");
    await expect(
      page.locator('[data-clients-status-section="active"]'),
    ).toBeVisible();
    const activeCard = page.locator(
      '[data-clients-status-list="active"] [data-client-id]',
    );
    await expect(activeCard).toHaveCount(1);

    await ctx.close();
  });

  test("edit a client (status -> past) moves them to the past section", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUpNewUser(page);

    // Seed an active client.
    await page.goto("/me/clients/new");
    await page.locator('[data-client-input="name"]').fill("Old Client");
    await page.locator('[data-client-submit="create"]').click();
    await page.waitForURL(/\/me\/clients\/[a-f0-9-]+$/, { timeout: 10_000 });

    // Change status to past via the edit form on the detail page.
    await page.locator('[data-client-input="status"]').selectOption("past");
    await page.locator('[data-client-submit="edit"]').click();

    // Wait for the server action to commit + the detail page to
    // re-render with the new status visible in the header subtitle.
    await expect(
      page.getByText(/Client · Past/),
    ).toBeVisible({ timeout: 10_000 });

    // Roster now shows the client under past, not active.
    await page.goto("/me/clients");
    await expect(
      page.locator(
        '[data-clients-status-list="past"] [data-client-id]',
      ),
    ).toHaveCount(1);
    await expect(
      page.locator(
        '[data-clients-status-list="active"] [data-client-id]',
      ),
    ).toHaveCount(0);

    await ctx.close();
  });

  test("delete a client redirects to roster + removes the row", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUpNewUser(page);

    await page.goto("/me/clients/new");
    await page.locator('[data-client-input="name"]').fill("To be deleted");
    await page.locator('[data-client-submit="create"]').click();
    await page.waitForURL(/\/me\/clients\/[a-f0-9-]+$/, { timeout: 10_000 });

    await page.locator('[data-client-delete="true"]').click();
    await page.locator('[data-client-confirm-delete="true"]').click();

    await page.waitForURL(/\/me\/clients$/, { timeout: 10_000 });
    await expect(page.locator("[data-client-id]")).toHaveCount(0);

    await ctx.close();
  });

  test("RLS: user B cannot see user A's clients", async ({ browser }) => {
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await signUpNewUser(pageA);
    await pageA.goto("/me/clients/new");
    await pageA.locator('[data-client-input="name"]').fill("A's secret client");
    await pageA.locator('[data-client-submit="create"]').click();
    await pageA.waitForURL(/\/me\/clients\/[a-f0-9-]+$/, { timeout: 10_000 });
    await ctxA.close();

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await signUpNewUser(pageB);
    await pageB.goto("/me/clients");
    await expect(pageB.locator('[data-clients-empty="true"]')).toBeVisible();
    await expect(pageB.locator("[data-client-id]")).toHaveCount(0);

    await ctxB.close();
  });

  test("link an earning to a client: shows on the client detail page", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUpNewUser(page);

    // Create a client first.
    await page.goto("/me/clients/new");
    await page.locator('[data-client-input="name"]').fill("Linked Client");
    await page.locator('[data-client-submit="create"]').click();
    await page.waitForURL(/\/me\/clients\/[a-f0-9-]+$/, { timeout: 10_000 });
    const clientUrl = page.url();

    // Add an earning, link it to this client.
    await page.goto("/me/earnings");
    await page.locator('[data-earning-input="amount"]').fill("500");
    await page.locator('[data-earning-input="currency"]').selectOption("USD");
    await page
      .locator('[data-earning-input="source"]')
      .fill("Project from Linked Client");
    await page
      .locator('[data-earning-input="client_id"]')
      .selectOption({ label: "Linked Client" });
    await page.locator('[data-earning-submit="true"]').click();
    await expect(page.locator("[data-earning-id]")).toHaveCount(1, {
      timeout: 10_000,
    });

    // Back on the client detail, the earning shows up.
    await page.goto(clientUrl);
    await expect(
      page.locator('[data-client-earnings="true"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-client-earnings-list="true"]'),
    ).toContainText("Project from Linked Client");
    await expect(
      page.locator('[data-client-earnings-list="true"]'),
    ).toContainText("$500.00");

    await ctx.close();
  });
});

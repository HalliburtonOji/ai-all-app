import { test, expect } from "@playwright/test";
import { createProject, signUpNewUser } from "./helpers";

test.describe("Project memory", () => {
  test("a fact can be edited and the change persists", async ({ page }) => {
    await signUpNewUser(page);
    await createProject(page, { name: "Edit fact test", type: "channel" });

    // Open the Memory tab
    await page.getByRole("link", { name: /^Memory/ }).click();
    await page.waitForURL(/tab=memory/);

    // Trigger one mock extraction (admin button is exposed in test mode)
    await page.getByRole("button", { name: "Run extraction now" }).click();
    const factItem = page.locator("[data-fact-id]").first();
    await expect(factItem).toBeVisible({ timeout: 10_000 });

    // Edit the fact
    await factItem.hover();
    await factItem.getByRole("button", { name: "Edit fact" }).click();

    const editor = page.getByRole("textbox", { name: "Edit fact text" });
    await expect(editor).toBeVisible();
    await editor.fill("My edited fact text");
    await page.getByRole("button", { name: "Save", exact: true }).click();

    // Updated text appears
    await expect(page.getByText("My edited fact text").first()).toBeVisible({
      timeout: 5_000,
    });

    // Persists across refresh
    await page.reload();
    await expect(page.getByText("My edited fact text").first()).toBeVisible();
  });

  test("a fact can be deleted with confirmation", async ({ page }) => {
    await signUpNewUser(page);
    await createProject(page, { name: "Delete fact test", type: "channel" });

    await page.getByRole("link", { name: /^Memory/ }).click();
    await page.waitForURL(/tab=memory/);

    await page.getByRole("button", { name: "Run extraction now" }).click();
    const factItem = page.locator("[data-fact-id]").first();
    await expect(factItem).toBeVisible({ timeout: 10_000 });

    const factText = (await factItem.locator("p").first().innerText()).trim();

    await factItem.hover();
    await factItem.getByRole("button", { name: "Delete fact" }).click();
    await page
      .getByRole("button", { name: "Yes, delete", exact: true })
      .click();

    await expect(page.getByText(factText)).toHaveCount(0);
    await page.reload();
    await expect(page.getByText(factText)).toHaveCount(0);
  });

  test("a fact can be pinned and sorts to the top", async ({ page }) => {
    await signUpNewUser(page);
    await createProject(page, { name: "Pin fact test", type: "channel" });

    await page.getByRole("link", { name: /^Memory/ }).click();
    await page.waitForURL(/tab=memory/);

    // Insert two facts (each Run extraction now adds one mock fact)
    await page.getByRole("button", { name: "Run extraction now" }).click();
    await expect(page.locator("[data-fact-id]")).toHaveCount(1, {
      timeout: 10_000,
    });

    // Slight wait so the second fact has a strictly later created_at
    await page.waitForTimeout(50);

    await page.getByRole("button", { name: "Run extraction now" }).click();
    await expect(page.locator("[data-fact-id]")).toHaveCount(2, {
      timeout: 10_000,
    });

    // The OLDER fact is at index 1 (newer is at top by default).
    const olderFact = page.locator("[data-fact-id]").nth(1);
    const olderFactId = await olderFact.getAttribute("data-fact-id");
    expect(olderFactId).toBeTruthy();

    await olderFact.hover();
    await olderFact.getByRole("button", { name: "Pin fact" }).click();

    // After pinning, the older fact should be at top, with data-pinned="true"
    const topFact = page.locator("[data-fact-id]").first();
    await expect(topFact).toHaveAttribute("data-fact-id", olderFactId!);
    await expect(topFact).toHaveAttribute("data-pinned", "true");
  });

  test("RLS: User B cannot access User A's project page or facts", async ({
    browser,
  }) => {
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await signUpNewUser(pageA);
    await createProject(pageA, {
      name: "Private memory project",
      type: "channel",
    });

    // Extract a fact in A
    await pageA.getByRole("link", { name: /^Memory/ }).click();
    await pageA.waitForURL(/tab=memory/);
    await pageA.getByRole("button", { name: "Run extraction now" }).click();
    await expect(pageA.locator("[data-fact-id]").first()).toBeVisible({
      timeout: 10_000,
    });

    const projectIdA = pageA.url().split("/projects/")[1].split("?")[0];
    await ctxA.close();

    // User B
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await signUpNewUser(pageB);

    // B navigates directly to A's project / Memory tab — should 404
    const res = await pageB.goto(`/projects/${projectIdA}?tab=memory`);
    expect(res?.status()).toBe(404);

    await ctxB.close();
  });

  test("memory facts are injected into the coach system prompt", async ({
    page,
  }) => {
    await signUpNewUser(page);
    await createProject(page, {
      name: "Memory injection test",
      type: "channel",
    });

    // Extract one mock fact
    await page.getByRole("link", { name: /^Memory/ }).click();
    await page.waitForURL(/tab=memory/);
    await page.getByRole("button", { name: "Run extraction now" }).click();
    await expect(page.locator("[data-fact-id]")).toHaveCount(1, {
      timeout: 10_000,
    });

    // Switch back to Coach and send a message. The mock includes
    // `[memory: N]` when the project has facts, so the assertion proves
    // the facts reached the coach API.
    await page.getByRole("link", { name: /^Coach/ }).click();
    await page.waitForURL(
      (u) => !u.toString().includes("tab=memory"),
      { timeout: 5_000 },
    );

    await page
      .getByPlaceholder("Ask the coach anything…")
      .fill("test memory injection");
    await page.getByRole("button", { name: "Send", exact: true }).click();

    await expect(
      page.getByText(/\[memory: 1\]/).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("project facts cap at 50; oldest non-pinned dropped on overflow", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    await signUpNewUser(page);
    await createProject(page, { name: "Cap test", type: "channel" });

    await page.getByRole("link", { name: /^Memory/ }).click();
    await page.waitForURL(/tab=memory/);

    // 51 mock extractions. Each inserts 1 fact; the 51st triggers cap
    // enforcement which deletes the oldest non-pinned fact.
    // We locate by data-attribute so the locator survives the button's
    // text flipping between "Run extraction now" and "Running…".
    const extractBtn = page.locator('[data-extract-button="true"]');
    for (let i = 0; i < 51; i++) {
      await extractBtn.click();
      await expect(extractBtn).toBeEnabled({ timeout: 10_000 });
    }

    await page.reload();

    await expect(page.locator("[data-fact-id]")).toHaveCount(50, {
      timeout: 10_000,
    });
  });

  test("cron endpoint without CRON_SECRET returns 401", async ({ request }) => {
    const res = await request.get("/api/cron/extract-facts");
    expect(res.status()).toBe(401);
  });
});

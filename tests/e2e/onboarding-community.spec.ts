import { test, expect } from "./auth-fixture";
import { signUpNewUser } from "./helpers";

/**
 * Phase 6: welcome flow + wins feed + failure forum.
 * Each test signs up a fresh user — the flows are user-scoped and
 * we don't want one test's posts leaking into another's assertions.
 */

test.describe("Phase 6a — welcome flow", () => {
  test("dashboard shows welcome banner; clicking it lands on /welcome", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUpNewUser(page);

    await expect(
      page.locator('[data-dashboard-welcome-banner="true"]'),
    ).toBeVisible();
    await page.locator('[data-dashboard-welcome-link="true"]').click();
    await page.waitForURL(/\/welcome$/);
    await expect(
      page.locator('[data-welcome-wizard="true"]'),
    ).toBeVisible();

    await ctx.close();
  });

  test("complete the wizard: pick role + bio + goal + project, land on project", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUpNewUser(page);

    await page.goto("/welcome");

    // Step 1: pick role + bio
    await page.locator('[data-welcome-role="builder"]').click();
    await page
      .locator('[data-welcome-bio="true"]')
      .fill("Lagos illustrator pivoting to AI concepts");
    await page.locator('[data-welcome-next="true"]').click();
    await expect(page.locator('[data-welcome-step-2="true"]')).toBeVisible();

    // Step 2: goal
    await page
      .locator('[data-welcome-goal="true"]')
      .fill("Charge $400/video for AI-assisted YouTube edits in 3 months");
    await page.locator('[data-welcome-next="true"]').click();
    await expect(page.locator('[data-welcome-step-3="true"]')).toBeVisible();

    // Step 3: project
    await page
      .locator('[data-welcome-project-name="true"]')
      .fill("AI YouTube edits");
    await page
      .locator('[data-welcome-project-type="true"]')
      .selectOption("channel");
    await page.locator('[data-welcome-submit="true"]').click();

    // Land on the new project's page.
    await page.waitForURL(/\/projects\/[a-f0-9-]+$/, { timeout: 10_000 });

    // Banner is now gone on the dashboard.
    await page.goto("/dashboard");
    await expect(
      page.locator('[data-dashboard-welcome-banner="true"]'),
    ).toHaveCount(0);

    await ctx.close();
  });

  test("skipping the welcome leaves no facts but is harmless", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUpNewUser(page);

    await page.goto("/welcome");
    await page.locator('[data-welcome-skip="true"]').click();
    await page.waitForURL(/\/dashboard$/);

    // Banner is still there because we never posted any user_facts.
    await expect(
      page.locator('[data-dashboard-welcome-banner="true"]'),
    ).toBeVisible();

    await ctx.close();
  });
});

test.describe("Phase 6b — wins feed", () => {
  test("public output appears on /wins to anonymous viewers", async ({
    browser,
  }) => {
    // Creator: sign up, generate an image, toggle it public.
    const ctxCreator = await browser.newContext();
    const pageCreator = await ctxCreator.newPage();
    await signUpNewUser(pageCreator);

    await pageCreator.goto("/projects/new");
    await pageCreator
      .locator('input[name="name"]')
      .fill("Wins-feed source project");
    await pageCreator
      .locator('select[name="project_type"]')
      .selectOption("channel");
    await pageCreator
      .getByRole("button", { name: "Create project" })
      .click();
    await pageCreator.waitForURL(/\/projects\/[a-f0-9-]+$/);
    const projectUrl = pageCreator.url();

    await pageCreator.goto(`${projectUrl}?tab=studio&studio=image`);
    await pageCreator
      .getByLabel("Image prompt")
      .fill("a small ship for the wins feed");
    await pageCreator
      .locator('[data-studio-generate-button="true"]')
      .click();
    const tile = pageCreator
      .locator('[data-studio-output-kind="image"]')
      .first();
    await expect(tile).toBeVisible({ timeout: 15_000 });
    await tile.hover();
    await tile
      .getByRole("button", { name: "Add output to portfolio" })
      .click();
    await expect(tile).toHaveAttribute(
      "data-studio-output-public",
      "true",
      { timeout: 10_000 },
    );
    await ctxCreator.close();

    // Anon viewer hits /wins.
    const ctxAnon = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const pageAnon = await ctxAnon.newPage();
    const response = await pageAnon.goto("/wins");
    expect(response?.status()).toBe(200);
    await expect(
      pageAnon.locator('[data-wins-feed="true"]'),
    ).toBeVisible({ timeout: 10_000 });
    // At least one win tile (the one we just opted in).
    const winTiles = pageAnon.locator("[data-win-id]");
    expect(await winTiles.count()).toBeGreaterThan(0);
    await ctxAnon.close();
  });

  test("liking a win toggles count + state, requires auth", async ({
    browser,
  }) => {
    // Creator sets up a public win first.
    const ctxCreator = await browser.newContext();
    const pageCreator = await ctxCreator.newPage();
    await signUpNewUser(pageCreator);
    await pageCreator.goto("/projects/new");
    await pageCreator
      .locator('input[name="name"]')
      .fill("Likeable wins project");
    await pageCreator
      .locator('select[name="project_type"]')
      .selectOption("channel");
    await pageCreator
      .getByRole("button", { name: "Create project" })
      .click();
    await pageCreator.waitForURL(/\/projects\/[a-f0-9-]+$/);
    const projectUrl = pageCreator.url();
    await pageCreator.goto(`${projectUrl}?tab=studio&studio=image`);
    await pageCreator
      .getByLabel("Image prompt")
      .fill("a likeable thing");
    await pageCreator
      .locator('[data-studio-generate-button="true"]')
      .click();
    const tile = pageCreator
      .locator('[data-studio-output-kind="image"]')
      .first();
    await expect(tile).toBeVisible({ timeout: 15_000 });
    await tile.hover();
    await tile
      .getByRole("button", { name: "Add output to portfolio" })
      .click();
    await expect(tile).toHaveAttribute(
      "data-studio-output-public",
      "true",
      { timeout: 10_000 },
    );
    await ctxCreator.close();

    // Liker: separate user signs up + likes the win.
    const ctxLiker = await browser.newContext();
    const pageLiker = await ctxLiker.newPage();
    await signUpNewUser(pageLiker);
    await pageLiker.goto("/wins");
    const firstTile = pageLiker.locator("[data-win-id]").first();
    await expect(firstTile).toBeVisible({ timeout: 10_000 });

    const button = firstTile.locator('[data-win-like-button="true"]');
    await expect(button).toHaveAttribute("data-win-liked", "false");
    await button.click();
    await expect(button).toHaveAttribute(
      "data-win-liked",
      "true",
      { timeout: 5_000 },
    );

    // Click again — unlikes.
    await button.click();
    await expect(button).toHaveAttribute(
      "data-win-liked",
      "false",
      { timeout: 5_000 },
    );
    await ctxLiker.close();

    // Anon can see button but it's disabled (can't like).
    const ctxAnon = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const pageAnon = await ctxAnon.newPage();
    await pageAnon.goto("/wins");
    const anonButton = pageAnon
      .locator("[data-win-id]")
      .first()
      .locator('[data-win-like-button="true"]');
    await expect(anonButton).toBeDisabled();
    await ctxAnon.close();
  });

  test("/api/wins/like rejects unauthenticated callers", async ({
    playwright,
  }) => {
    const ctx = await playwright.request.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const response = await ctx.post("/api/wins/like", {
      data: { outputId: "00000000-0000-0000-0000-000000000000" },
    });
    expect(response.status()).toBe(401);
    await ctx.dispose();
  });
});

test.describe("Phase 6c — failure forum", () => {
  test("post a failure note + appears in feed + can delete", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUpNewUser(page);

    await page.goto("/community/failures");
    await expect(
      page.getByRole("heading", { name: /Failure forum/ }),
    ).toBeVisible();

    const note =
      "I cold-emailed 30 prospects. Got 0 replies. The subject line was the problem.";
    await page.locator('[data-failure-post-input="true"]').fill(note);
    await page.locator('[data-failure-post-submit="true"]').click();

    const row = page.locator("[data-failure-id]").first();
    await expect(row).toBeVisible({ timeout: 10_000 });
    await expect(row).toContainText(note);
    await expect(row).toHaveAttribute("data-failure-owner", "true");

    // Delete it (with confirm step).
    await row.locator('[data-failure-delete="true"]').click();
    await row.locator('[data-failure-confirm-delete="true"]').click();
    await expect(page.locator("[data-failure-id]")).toHaveCount(0, {
      timeout: 10_000,
    });

    await ctx.close();
  });

  test("anonymous viewer is redirected away from /community/failures", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const page = await ctx.newPage();
    const response = await page.goto("/community/failures");
    // The (app) layout redirects unauthenticated users to /login.
    expect(page.url()).toContain("/login");
    expect(response?.status()).toBeLessThan(500);
    await ctx.close();
  });
});

import { test, expect } from "./auth-fixture";
import { createProject, signUpNewUser } from "./helpers";
import { deriveUsername } from "@/lib/portfolio/username";

test.describe("Phase 4a — portfolio passport", () => {
  test("toggle public + visible on /p/[username] to anon viewer", async ({
    browser,
  }) => {
    // Fresh creator context so we know their email -> username.
    const ctxCreator = await browser.newContext();
    const pageCreator = await ctxCreator.newPage();
    const creator = await signUpNewUser(pageCreator);
    const username = deriveUsername(creator.email);

    const projectId = await createProject(pageCreator, {
      name: "Portfolio toggle",
      type: "channel",
    });

    await pageCreator.goto(`/projects/${projectId}?tab=studio&studio=image`);
    await pageCreator
      .getByLabel("Image prompt")
      .fill("a single sunlit window for the portfolio");
    await pageCreator
      .locator('[data-studio-generate-button="true"]')
      .click();

    const tile = pageCreator
      .locator('[data-studio-output-kind="image"]')
      .first();
    await expect(tile).toBeVisible({ timeout: 15_000 });
    await expect(tile).toHaveAttribute(
      "data-studio-output-public",
      "false",
    );

    // Toggle to public.
    await tile.hover();
    await tile.getByRole("button", { name: "Add output to portfolio" }).click();
    await expect(tile).toHaveAttribute(
      "data-studio-output-public",
      "true",
      { timeout: 10_000 },
    );

    await ctxCreator.close();

    // Anon viewer hits the public route.
    const ctxAnon = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const pageAnon = await ctxAnon.newPage();
    const response = await pageAnon.goto(`/p/${username}`);
    expect(response?.status()).toBe(200);

    await expect(
      pageAnon.locator('[data-portfolio-grid="true"]'),
    ).toBeVisible();
    await expect(
      pageAnon.locator('[data-portfolio-output-kind="image"]'),
    ).toHaveCount(1);

    await ctxAnon.close();
  });

  test("private outputs do NOT appear on the public route", async ({
    browser,
  }) => {
    const ctxCreator = await browser.newContext();
    const pageCreator = await ctxCreator.newPage();
    const creator = await signUpNewUser(pageCreator);
    const username = deriveUsername(creator.email);

    const projectId = await createProject(pageCreator, {
      name: "Portfolio privacy",
      type: "channel",
    });

    await pageCreator.goto(`/projects/${projectId}?tab=studio&studio=image`);
    await pageCreator.getByLabel("Image prompt").fill("private piece");
    await pageCreator
      .locator('[data-studio-generate-button="true"]')
      .click();
    await expect(
      pageCreator.locator('[data-studio-output-kind="image"]').first(),
    ).toBeVisible({ timeout: 15_000 });

    // No toggle — leave it private (default).
    await ctxCreator.close();

    const ctxAnon = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const pageAnon = await ctxAnon.newPage();
    const response = await pageAnon.goto(`/p/${username}`);
    expect(response?.status()).toBe(200);

    await expect(
      pageAnon.locator('[data-portfolio-empty="true"]'),
    ).toBeVisible();
    await expect(
      pageAnon.locator('[data-portfolio-output-kind="image"]'),
    ).toHaveCount(0);

    await ctxAnon.close();
  });

  test("toggle public then back to private hides it again", async ({
    browser,
  }) => {
    const ctxCreator = await browser.newContext();
    const pageCreator = await ctxCreator.newPage();
    const creator = await signUpNewUser(pageCreator);
    const username = deriveUsername(creator.email);

    const projectId = await createProject(pageCreator, {
      name: "Portfolio toggle round-trip",
      type: "channel",
    });

    await pageCreator.goto(`/projects/${projectId}?tab=studio&studio=image`);
    await pageCreator.getByLabel("Image prompt").fill("round-trip piece");
    await pageCreator
      .locator('[data-studio-generate-button="true"]')
      .click();

    const tile = pageCreator
      .locator('[data-studio-output-kind="image"]')
      .first();
    await expect(tile).toBeVisible({ timeout: 15_000 });
    await tile.hover();
    await tile.getByRole("button", { name: "Add output to portfolio" }).click();
    await expect(tile).toHaveAttribute(
      "data-studio-output-public",
      "true",
      { timeout: 10_000 },
    );

    // Toggle back off — button label flips to "Make output private"
    await tile.getByRole("button", { name: "Make output private" }).click();
    await expect(tile).toHaveAttribute(
      "data-studio-output-public",
      "false",
      { timeout: 10_000 },
    );

    await ctxCreator.close();

    const ctxAnon = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const pageAnon = await ctxAnon.newPage();
    await pageAnon.goto(`/p/${username}`);
    await expect(
      pageAnon.locator('[data-portfolio-output-kind="image"]'),
    ).toHaveCount(0);
    await ctxAnon.close();
  });

  test("non-existent username returns 404", async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const page = await ctx.newPage();
    const response = await page.goto("/p/no_such_user_zzz_does_not_exist");
    expect(response?.status()).toBe(404);
    await ctx.close();
  });
});

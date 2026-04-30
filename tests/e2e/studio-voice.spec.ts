import { test, expect } from "./auth-fixture";
import { createProject, signUpNewUser } from "./helpers";

test.describe("Studio v2 — voice-over generator", () => {
  test("generate voice-over → tile + audio element appear, persist across reload", async ({
    page,
  }) => {
    const projectId = await createProject(page, {
      name: "Voice happy path",
      type: "channel",
    });

    await page.goto(`/projects/${projectId}?tab=studio&studio=voice`);
    await expect(page.locator('[data-studio-panel="voice"]')).toBeVisible();

    await page
      .getByLabel("Voice-over script")
      .fill("Welcome back to the channel.");
    await page.locator('[data-studio-generate-button="voice"]').click();

    const firstTile = page
      .locator('[data-studio-output-kind="audio"]')
      .first();
    await expect(firstTile).toBeVisible({ timeout: 15_000 });
    await expect(firstTile.locator("audio")).toHaveCount(1);

    await page.reload();
    await expect(
      page.locator('[data-studio-output-kind="audio"]'),
    ).toHaveCount(1);
  });

  test("script over the 500-char cap is rejected, no tile created", async ({
    page,
  }) => {
    const projectId = await createProject(page, {
      name: "Voice cap test",
      type: "channel",
    });

    await page.goto(`/projects/${projectId}?tab=studio&studio=voice`);

    // The textarea enforces maxLength=500 in the DOM, so Playwright's
    // fill() truncates. Bypass the limit by setting .value directly +
    // dispatching the input event so React picks up the change.
    const overLong = "a ".repeat(260) + "x"; // 521 chars
    const scriptField = page.getByLabel("Voice-over script");
    await scriptField.evaluate((el, value) => {
      const ta = el as HTMLTextAreaElement;
      // Drop maxlength so we can stage an over-cap value
      ta.removeAttribute("maxlength");
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value",
      )?.set;
      setter?.call(ta, value);
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    }, overLong);

    // The Generate button is disabled while overCap (client-side guard).
    const btn = page.locator('[data-studio-generate-button="voice"]');
    await expect(btn).toBeDisabled();
    await expect(
      page.locator('[data-studio-output-kind="audio"]'),
    ).toHaveCount(0);
  });

  test("RLS: user B cannot see user A's voice-overs", async ({ browser }) => {
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await signUpNewUser(pageA);
    const projectIdA = await createProject(pageA, {
      name: "User A voice",
      type: "channel",
    });

    await pageA.goto(`/projects/${projectIdA}?tab=studio&studio=voice`);
    await pageA
      .getByLabel("Voice-over script")
      .fill("A's secret narration");
    await pageA.locator('[data-studio-generate-button="voice"]').click();
    await expect(
      pageA.locator('[data-studio-output-kind="audio"]').first(),
    ).toBeVisible({ timeout: 15_000 });
    await ctxA.close();

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await signUpNewUser(pageB);

    const responseB = await pageB.goto(
      `/projects/${projectIdA}?tab=studio&studio=voice`,
    );
    expect(responseB?.status()).toBe(404);

    const projectIdB = await createProject(pageB, {
      name: "User B voice",
      type: "channel",
    });
    await pageB.goto(`/projects/${projectIdB}?tab=studio&studio=voice`);
    await expect(
      pageB.locator('[data-studio-empty-state="audio"]'),
    ).toBeVisible();
    await expect(
      pageB.locator('[data-studio-output-kind="audio"]'),
    ).toHaveCount(0);

    await ctxB.close();
  });

  test("delete voice-over: tile + Storage row gone, persists across reload", async ({
    page,
  }) => {
    const projectId = await createProject(page, {
      name: "Voice delete test",
      type: "channel",
    });

    await page.goto(`/projects/${projectId}?tab=studio&studio=voice`);
    await page.getByLabel("Voice-over script").fill("To be deleted.");
    await page.locator('[data-studio-generate-button="voice"]').click();

    const tile = page.locator('[data-studio-output-kind="audio"]').first();
    await expect(tile).toBeVisible({ timeout: 15_000 });

    await tile.hover();
    await tile.getByRole("button", { name: "Delete output" }).click();

    await expect(
      page.locator('[data-studio-output-kind="audio"]'),
    ).toHaveCount(0, { timeout: 10_000 });
    await page.reload();
    await expect(
      page.locator('[data-studio-output-kind="audio"]'),
    ).toHaveCount(0);
  });

  test("memory-aware: generated tile records 'mock-audio-with-context'", async ({
    page,
  }) => {
    const projectId = await createProject(page, {
      name: "Memory-aware voice",
      type: "channel",
    });

    await page.goto(`/projects/${projectId}?tab=memory`);
    await page.locator('[data-extract-button="true"]').click();
    await expect(page.locator("[data-fact-id]").first()).toBeVisible({
      timeout: 10_000,
    });

    await page.goto(`/projects/${projectId}?tab=studio&studio=voice`);
    await page
      .getByLabel("Voice-over script")
      .fill("Hello, this is the project voice.");
    await page.locator('[data-studio-generate-button="voice"]').click();

    const tile = page.locator('[data-studio-output-kind="audio"]').first();
    await expect(tile).toBeVisible({ timeout: 15_000 });
    await expect(tile).toHaveAttribute(
      "data-studio-output-model",
      "mock-audio-with-context",
    );
  });
});

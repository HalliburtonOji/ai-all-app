import { test, expect } from "./auth-fixture";
import { createProject } from "./helpers";

const SAMPLE_THREAD = `From: Sarah <sarah@acme.example>
Sent: Yesterday 14:02
Subject: Re: project timeline

Hey — quick one. We're going to need the brand kit by Tuesday at the
latest, not Friday. Possible? Happy to extend the contract a little
to make it work. Let me know.

— Sarah`;

const SAMPLE_INTENT =
  "Thank her, accept the new Tuesday deadline, ask if she wants to do a 30-min call Monday to align before I push.";

test.describe("Phase 11 — Studio email-reply drafter", () => {
  test("4th tool card opens the email-reply panel + drafts a reply", async ({
    page,
  }) => {
    const projectId = await createProject(page, {
      name: "Email reply happy path",
      type: "client",
    });

    await page.goto(`/projects/${projectId}?tab=studio`);
    await expect(
      page.locator('[data-studio-tool-grid="true"]'),
    ).toBeVisible();

    // 4 tool cards now (image / text / voice / email-reply).
    const cards = page.locator("[data-studio-tool-card]");
    expect(await cards.count()).toBe(4);

    await page.locator('[data-studio-tool-card="email-reply"]').click();
    await page.waitForURL(/\/projects\/.+studio=email-reply/);

    await expect(
      page.locator('[data-studio-panel="email-reply"]'),
    ).toBeVisible();

    await page.locator('[data-studio-email-thread="true"]').fill(SAMPLE_THREAD);
    await page.locator('[data-studio-email-intent="true"]').fill(SAMPLE_INTENT);
    await page.locator('[data-studio-generate-button="email-reply"]').click();

    // Draft appears in the gallery (kind=text, kind_hint=email_reply).
    const tile = page.locator('[data-studio-output-kind="text"]').first();
    await expect(tile).toBeVisible({ timeout: 15_000 });
    // Mock-mode marker confirms the kind + extra-context were passed through.
    await expect(tile).toContainText("kind=email_reply");
    await expect(tile).toContainText("extra-applied");
  });

  test("submitting with empty thread is blocked client-side", async ({
    page,
  }) => {
    const projectId = await createProject(page, {
      name: "Email reply empty thread",
      type: "client",
    });
    await page.goto(`/projects/${projectId}?tab=studio&studio=email-reply`);

    // Only fill the intent; thread stays empty.
    await page
      .locator('[data-studio-email-intent="true"]')
      .fill("Reply that we'll send updates Monday.");
    await expect(
      page.locator('[data-studio-generate-button="email-reply"]'),
    ).toBeDisabled();
  });
});

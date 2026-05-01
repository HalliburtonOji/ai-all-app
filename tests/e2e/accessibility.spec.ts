import { AxeBuilder } from "@axe-core/playwright";
import { test, expect } from "./auth-fixture";
import { createProject } from "./helpers";

/**
 * Automated accessibility audit using axe-core. For each major route,
 * runs axe and asserts there are NO violations of impact `serious` or
 * `critical` (the WCAG A/AA tier most users actually depend on).
 *
 * Moderate + minor violations are not asserted here — they're a long
 * tail of "could be better" issues that aren't blocking real use.
 *
 * If a route legitimately has a violation that's expensive to fix
 * (e.g. a third-party widget), use AxeBuilder.disableRules([...])
 * with a comment justifying the exception. Don't loosen the impact
 * filter wholesale.
 */

async function expectNoSeriousA11yViolations(
  page: import("@playwright/test").Page,
) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  if (blocking.length > 0) {
    const summary = blocking
      .map((v) => {
        const nodeDetails = v.nodes
          .map(
            (n) =>
              `    target: ${n.target.join(" > ")}\n    html: ${n.html.slice(0, 200)}\n    failureSummary: ${n.failureSummary?.slice(0, 300) ?? "n/a"}`,
          )
          .join("\n");
        return `[${v.impact}] ${v.id} — ${v.help} (nodes: ${v.nodes.length}) — ${v.helpUrl}\n${nodeDetails}`;
      })
      .join("\n\n");
    throw new Error(
      `axe-core found ${blocking.length} blocking violation(s):\n${summary}`,
    );
  }
  expect(blocking).toHaveLength(0);
}

test.describe("Accessibility — WCAG A/AA, blocking violations only", () => {
  test("/dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: /Welcome,/ }),
    ).toBeVisible();
    await expectNoSeriousA11yViolations(page);
  });

  test("/projects", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.getByRole("link", { name: "AI All App" })).toBeVisible();
    await expectNoSeriousA11yViolations(page);
  });

  test("/projects/new", async ({ page }) => {
    await page.goto("/projects/new");
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expectNoSeriousA11yViolations(page);
  });

  test("project detail — Coach tab", async ({ page }) => {
    const projectId = await createProject(page, {
      name: "A11y coach test",
      type: "channel",
    });
    await page.goto(`/projects/${projectId}`);
    await expect(
      page.getByPlaceholder("Ask the coach anything…"),
    ).toBeVisible();
    await expectNoSeriousA11yViolations(page);
  });

  test("project detail — Memory tab", async ({ page }) => {
    const projectId = await createProject(page, {
      name: "A11y memory test",
      type: "channel",
    });
    await page.goto(`/projects/${projectId}?tab=memory`);
    await expect(
      page.locator('[data-extract-button="true"]'),
    ).toBeVisible();
    await expectNoSeriousA11yViolations(page);
  });

  test("project detail — Studio tool grid", async ({ page }) => {
    const projectId = await createProject(page, {
      name: "A11y studio grid",
      type: "channel",
    });
    await page.goto(`/projects/${projectId}?tab=studio`);
    await expect(
      page.locator('[data-studio-tool-grid="true"]'),
    ).toBeVisible();
    await expectNoSeriousA11yViolations(page);
  });

  test("project detail — Studio image panel", async ({ page }) => {
    const projectId = await createProject(page, {
      name: "A11y studio image",
      type: "channel",
    });
    await page.goto(`/projects/${projectId}?tab=studio&studio=image`);
    await expect(page.getByLabel("Image prompt")).toBeVisible();
    await expectNoSeriousA11yViolations(page);
  });

  test("project detail — Studio text panel", async ({ page }) => {
    const projectId = await createProject(page, {
      name: "A11y studio text",
      type: "channel",
    });
    await page.goto(`/projects/${projectId}?tab=studio&studio=text`);
    await expect(page.getByLabel("Text draft prompt")).toBeVisible();
    await expectNoSeriousA11yViolations(page);
  });

  test("project detail — Studio voice panel", async ({ page }) => {
    const projectId = await createProject(page, {
      name: "A11y studio voice",
      type: "channel",
    });
    await page.goto(`/projects/${projectId}?tab=studio&studio=voice`);
    await expect(page.getByLabel("Voice-over script")).toBeVisible();
    await expectNoSeriousA11yViolations(page);
  });

  // Phase 4 + 5 + 6 routes — added later but using the same shape.

  test("/me/earnings (Phase 4b)", async ({ page }) => {
    await page.goto("/me/earnings");
    await expect(
      page.getByRole("heading", { name: /What you've made/ }),
    ).toBeVisible();
    await expectNoSeriousA11yViolations(page);
  });

  test("/learn (Phase 5) catalog", async ({ page }) => {
    await page.goto("/learn");
    await expect(
      page.getByRole("heading", { name: /Get genuinely good at AI/ }),
    ).toBeVisible();
    await expectNoSeriousA11yViolations(page);
  });

  test("/learn/[slug] (Phase 5) lesson player + tutor sidebar", async ({
    page,
  }) => {
    await page.goto("/learn/foundations-01-what-is-ai");
    await expect(
      page.getByRole("heading", { name: "What's actually in the AI box" }),
    ).toBeVisible();
    await expectNoSeriousA11yViolations(page);
  });

  test("/welcome (Phase 6a) wizard", async ({ page }) => {
    await page.goto("/welcome");
    await expect(page.locator('[data-welcome-wizard="true"]')).toBeVisible();
    await expectNoSeriousA11yViolations(page);
  });

  test("/wins (Phase 6b) public feed", async ({ page }) => {
    await page.goto("/wins");
    await expect(
      page.getByRole("heading", { name: /What people are shipping/ }),
    ).toBeVisible();
    await expectNoSeriousA11yViolations(page);
  });

  test("/community/failures (Phase 6c) forum", async ({ page }) => {
    await page.goto("/community/failures");
    await expect(
      page.getByRole("heading", { name: /Failure forum/ }),
    ).toBeVisible();
    await expectNoSeriousA11yViolations(page);
  });
});

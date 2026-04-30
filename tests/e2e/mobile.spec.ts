import { test, expect } from "./auth-fixture";
import { createProject } from "./helpers";

const IPHONE_SE_VIEWPORT = { width: 375, height: 667 } as const;

/**
 * Mobile pass at iPhone SE viewport (375 × 667). Catches horizontal-
 * overflow regressions and verifies critical interactive surfaces
 * stay reachable on small screens. Each test creates its own project
 * via the worker auth fixture, then visits a route and asserts:
 *
 *   1. document.documentElement.scrollWidth ≤ viewport.width + 1
 *      (no horizontal scroll — the canonical mobile-break signal)
 *   2. Key interactive element is visible + clickable
 *
 * If anything in this file flakes, the right move is usually a CSS fix
 * in the source component, not loosening the assertion.
 */

test.describe("Mobile pass — iPhone SE 375px", () => {
  test.use({ viewport: IPHONE_SE_VIEWPORT });

  async function expectNoHorizontalScroll(
    page: import("@playwright/test").Page,
    viewportWidth: number,
  ) {
    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    // Allow 1px tolerance for sub-pixel rounding on Windows / Linux.
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 1);
  }

  test("/dashboard renders without horizontal scroll", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: /Welcome,/ }),
    ).toBeVisible();
    await expectNoHorizontalScroll(page, IPHONE_SE_VIEWPORT.width);
  });

  test("/projects renders without horizontal scroll", async ({ page }) => {
    await page.goto("/projects");
    // The list page always has either projects or an empty state — assert
    // the page renders with the navbar logo at minimum.
    await expect(page.getByRole("link", { name: "AI All App" })).toBeVisible();
    await expectNoHorizontalScroll(page, IPHONE_SE_VIEWPORT.width);
  });

  test("/projects/new form is fully reachable", async ({ page }) => {
    await page.goto("/projects/new");
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('select[name="project_type"]')).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create project" }),
    ).toBeVisible();
    await expectNoHorizontalScroll(page, IPHONE_SE_VIEWPORT.width);
  });

  test("project detail — Coach tab — textarea + Send reachable", async ({
    page,
  }) => {
    const projectId = await createProject(page, {
      name: "Mobile coach test",
      type: "channel",
    });
    await page.goto(`/projects/${projectId}`);
    await expect(
      page.getByPlaceholder("Ask the coach anything…"),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send", exact: true }),
    ).toBeVisible();
    await expectNoHorizontalScroll(page, IPHONE_SE_VIEWPORT.width);
  });

  test("project detail — Memory tab", async ({ page }) => {
    const projectId = await createProject(page, {
      name: "Mobile memory test",
      type: "channel",
    });
    await page.goto(`/projects/${projectId}?tab=memory`);
    // Memory tab has no heading; admin button is always visible in test mode.
    await expect(
      page.locator('[data-extract-button="true"]'),
    ).toBeVisible();
    await expectNoHorizontalScroll(page, IPHONE_SE_VIEWPORT.width);
  });

  test("project detail — Studio tool grid", async ({ page }) => {
    const projectId = await createProject(page, {
      name: "Mobile studio grid",
      type: "channel",
    });
    await page.goto(`/projects/${projectId}?tab=studio`);
    await expect(
      page.locator('[data-studio-tool-grid="true"]'),
    ).toBeVisible();
    // Three tool cards, all clickable, all visible (1-col stack on mobile)
    await expect(page.locator("[data-studio-tool-card]")).toHaveCount(3);
    for (const id of ["image", "text", "voice"]) {
      await expect(
        page.locator(`[data-studio-tool-card="${id}"]`),
      ).toBeVisible();
    }
    await expectNoHorizontalScroll(page, IPHONE_SE_VIEWPORT.width);
  });

  test("project detail — Studio image panel form reachable", async ({
    page,
  }) => {
    const projectId = await createProject(page, {
      name: "Mobile studio image",
      type: "channel",
    });
    await page.goto(`/projects/${projectId}?tab=studio&studio=image`);
    await expect(page.getByLabel("Image prompt")).toBeVisible();
    await expect(
      page.locator('[data-studio-generate-button="true"]'),
    ).toBeVisible();
    await expectNoHorizontalScroll(page, IPHONE_SE_VIEWPORT.width);
  });

  test("project detail — Studio text panel form reachable", async ({
    page,
  }) => {
    const projectId = await createProject(page, {
      name: "Mobile studio text",
      type: "channel",
    });
    await page.goto(`/projects/${projectId}?tab=studio&studio=text`);
    await expect(page.getByLabel("Text draft prompt")).toBeVisible();
    await expect(
      page.locator('[data-studio-generate-button="text"]'),
    ).toBeVisible();
    await expectNoHorizontalScroll(page, IPHONE_SE_VIEWPORT.width);
  });

  test("project detail — Studio voice panel form reachable", async ({
    page,
  }) => {
    const projectId = await createProject(page, {
      name: "Mobile studio voice",
      type: "channel",
    });
    await page.goto(`/projects/${projectId}?tab=studio&studio=voice`);
    await expect(page.getByLabel("Voice-over script")).toBeVisible();
    await expect(
      page.locator('[data-studio-generate-button="voice"]'),
    ).toBeVisible();
    await expectNoHorizontalScroll(page, IPHONE_SE_VIEWPORT.width);
  });
});

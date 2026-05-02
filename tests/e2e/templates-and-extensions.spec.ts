import { test, expect } from "./auth-fixture";
import { signUpNewUser } from "./helpers";

/**
 * Three small builds shipped together:
 *   - Project template gallery on /projects/new
 *   - Studio code-kind on the text drafter
 *   - Tool Fluency lesson branch (third Learn branch)
 *
 * Each test signs up a fresh user where state isolation matters.
 */

test.describe("Project template gallery", () => {
  test("templates render and clicking one prefills the form", async ({
    page,
  }) => {
    await page.goto("/projects/new");
    await expect(
      page.locator('[data-project-templates="true"]'),
    ).toBeVisible();
    // We shipped 7 templates.
    const cards = page.locator("[data-project-template-slug]");
    expect(await cards.count()).toBeGreaterThanOrEqual(6);

    // Apply the YouTube channel template.
    await page
      .locator('[data-project-template-slug="youtube-channel"]')
      .click();
    await page.waitForURL(/\/projects\/new\?template=youtube-channel/);

    // Banner shows + form fields are pre-filled.
    await expect(
      page.locator('[data-project-template-applied="youtube-channel"]'),
    ).toBeVisible();
    await expect(page.locator('input[name="name"]')).toHaveValue(
      "My YouTube channel",
    );
    await expect(page.locator('select[name="project_type"]')).toHaveValue(
      "channel",
    );
  });

  test("creating from a template lands on a real project", async ({
    page,
  }) => {
    await page.goto("/projects/new?template=freelance-design");
    await expect(page.locator('input[name="name"]')).toHaveValue(
      "Freelance design practice",
    );
    await page.getByRole("button", { name: "Create project" }).click();
    await page.waitForURL(/\/projects\/[a-f0-9-]+$/, { timeout: 10_000 });
    await expect(
      page.getByText("Freelance design practice").first(),
    ).toBeVisible();
  });
});

test.describe("Studio text drafter — code kind", () => {
  test("code kind is selectable + draft persists", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUpNewUser(page);

    // Make a project.
    await page.goto("/projects/new");
    await page.locator('input[name="name"]').fill("Code helper test");
    await page
      .locator('select[name="project_type"]')
      .selectOption("product");
    await page.getByRole("button", { name: "Create project" }).click();
    await page.waitForURL(/\/projects\/[a-f0-9-]+$/, { timeout: 10_000 });
    const projectUrl = page.url();

    // Open the text drafter, pick "Code", generate.
    await page.goto(`${projectUrl}?tab=studio&studio=text`);
    await expect(
      page.locator('[data-studio-panel="text"]'),
    ).toBeVisible();
    await page
      .getByLabel("Text draft prompt")
      .fill("Python function to reverse a string");
    await page.getByLabel("Draft type").selectOption("code");
    await page.locator('[data-studio-generate-button="text"]').click();

    const tile = page
      .locator('[data-studio-output-kind="text"]')
      .first();
    await expect(tile).toBeVisible({ timeout: 15_000 });
    // Mock-mode marker confirms the kind=code was passed through.
    await expect(tile).toContainText("kind=code");

    await ctx.close();
  });
});

test.describe("Tool Fluency lesson branch", () => {
  test("third branch shows on /learn with at least one lesson", async ({
    page,
  }) => {
    await page.goto("/learn");
    await expect(
      page.locator('[data-learn-branch="tool-fluency"]'),
    ).toBeVisible();
    const cards = page.locator(
      '[data-learn-branch-list="tool-fluency"] [data-lesson-slug]',
    );
    expect(await cards.count()).toBeGreaterThanOrEqual(3);
  });

  test("opening a Tool Fluency lesson renders the body", async ({ page }) => {
    await page.goto("/learn/tool-fluency-01-not-every-tool");
    await expect(
      page.getByRole("heading", { name: /You don't need every tool/ }),
    ).toBeVisible();
    await expect(
      page.locator('[data-lesson-body="true"]'),
    ).toBeVisible();
  });
});

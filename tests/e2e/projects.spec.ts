import { test, expect } from "./auth-fixture";
import { createProject, signUpNewUser } from "./helpers";

test.describe("Projects", () => {
  test("a logged-in user can create a project and sees it on /projects", async ({
    page,
  }) => {
    const projectName = `My TikTok channel ${Date.now()}`;

    await createProject(page, {
      name: projectName,
      type: "channel",
      description: "Cooking videos",
    });

    // Visit the list page
    await page.goto("/projects");
    await expect(page.getByText(projectName)).toBeVisible();
    await expect(page.getByText(/Side Hustle Channel/i).first()).toBeVisible();
  });

  test("a created project persists across a full page refresh", async ({
    page,
  }) => {
    const projectName = `Persisted project ${Date.now()}`;

    const id = await createProject(page, {
      name: projectName,
      type: "client",
    });

    // Reload the detail page
    await page.reload();
    await expect(page.getByText(projectName).first()).toBeVisible();

    // Reload the list page too
    await page.goto("/projects");
    await page.reload();
    await expect(page.getByText(projectName)).toBeVisible();

    // ID should still resolve
    await page.goto(`/projects/${id}`);
    await expect(page.getByText(projectName).first()).toBeVisible();
  });

  test("a user can edit a project name and the change persists", async ({
    page,
  }) => {
    const original = `Original name ${Date.now()}`;
    const updated = `Updated name ${Date.now()}`;

    await createProject(page, { name: original, type: "exploration" });

    // Click the editable name (button with aria-label "Edit name")
    await page.getByRole("button", { name: "Edit name" }).click();

    // Replace value and save
    await page.locator('input[name="value"]').fill(updated);
    await page.getByRole("button", { name: "Save", exact: true }).click();

    // The new name should appear, the old one should not
    await expect(page.getByText(updated).first()).toBeVisible();
    await expect(page.getByText(original)).toHaveCount(0);

    // Reload to confirm it persisted to the DB
    await page.reload();
    await expect(page.getByText(updated).first()).toBeVisible();
    await expect(page.getByText(original)).toHaveCount(0);
  });

  test("a user can delete a project and it disappears from the list", async ({
    page,
  }) => {
    const projectName = `To delete ${Date.now()}`;

    await createProject(page, { name: projectName, type: "sandbox" });

    // Open the delete confirmation
    await page
      .getByRole("button", { name: "Delete project" })
      .click();
    // Confirm
    await page.getByRole("button", { name: "Yes, delete" }).click();

    // Should redirect to /projects
    await page.waitForURL(/\/projects$/);
    // Project should not appear in the list
    await expect(page.getByText(projectName)).toHaveCount(0);
  });

  test("RLS: User B cannot see User A's project on /projects or by direct URL", async ({
    browser,
  }) => {
    const projectName = `Private project ${Date.now()}`;

    // ---- User A creates a project ----
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await signUpNewUser(pageA);
    const projectIdA = await createProject(pageA, {
      name: projectName,
      type: "channel",
    });
    await ctxA.close();

    // ---- User B logs in and tries to see User A's stuff ----
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await signUpNewUser(pageB);

    // /projects list should be empty for User B (no User A project visible)
    await pageB.goto("/projects");
    await expect(pageB.getByText(projectName)).toHaveCount(0);

    // Direct URL access to User A's project should NOT show the project
    const response = await pageB.goto(`/projects/${projectIdA}`);
    // Should either be a 404 or redirect away — either way, the project name
    // must NOT be visible on the page.
    await expect(pageB.getByText(projectName)).toHaveCount(0);
    // Bonus: the response status should be 404 (Next.js notFound())
    if (response) {
      expect(response.status()).toBe(404);
    }

    await ctxB.close();
  });
});

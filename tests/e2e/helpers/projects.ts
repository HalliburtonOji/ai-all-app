import { expect, type Page } from "@playwright/test";
import type { ProjectType } from "@/types/project";

export interface CreateProjectInput {
  name: string;
  type: ProjectType;
  description?: string;
}

/**
 * Create a project via the UI. Assumes user is already logged in.
 * Returns the new project's ID (parsed from /projects/[id] URL).
 */
export async function createProject(
  page: Page,
  input: CreateProjectInput,
): Promise<string> {
  await page.goto("/projects/new");
  await page.locator('input[name="name"]').fill(input.name);
  if (input.description) {
    await page.locator('textarea[name="description"]').fill(input.description);
  }
  await page.locator('select[name="project_type"]').selectOption(input.type);
  await page.getByRole("button", { name: "Create project" }).click();

  // Land on /projects/[id]
  await page.waitForURL(/\/projects\/[a-f0-9-]+$/);

  // Sanity: the project name should be visible somewhere on the page
  await expect(page.locator(`text=${input.name}`).first()).toBeVisible();

  const url = page.url();
  const id = url.split("/projects/")[1];
  return id;
}

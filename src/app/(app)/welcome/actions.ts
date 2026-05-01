"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

const ALLOWED_ROLES = new Set(["builder", "professional", "curious"]);

const ROLE_LABELS: Record<string, string> = {
  builder: "side-hustler / freelancer / indie creator",
  professional: "professional using AI to keep + grow my role",
  curious: "curious — just want to get genuinely good at AI",
};

const MAX_BIO = 240;
const MAX_GOAL = 500;
const MAX_PROJECT_NAME = 100;
const MAX_PROJECT_DESCRIPTION = 500;

const ALLOWED_PROJECT_TYPES = new Set([
  "channel",
  "client",
  "product",
  "job_search",
  "exploration",
  "sandbox",
]);

export interface SaveWelcomeResult {
  error?: string;
  ok?: true;
  projectId?: string;
}

/**
 * Save the welcome flow's three answers as user_facts (durable
 * cross-project memory the coach reads on every turn). Optionally
 * create a first Project too.
 *
 * The whole flow is skippable — partial submits are fine. Each field
 * is only written if non-empty.
 */
export async function saveWelcomeAnswers(
  formData: FormData,
): Promise<SaveWelcomeResult> {
  const role = ((formData.get("role") as string) ?? "").trim();
  const bio = ((formData.get("bio") as string) ?? "").trim();
  const goal = ((formData.get("goal") as string) ?? "").trim();
  const projectName = ((formData.get("project_name") as string) ?? "").trim();
  const projectType = ((formData.get("project_type") as string) ?? "").trim();
  const projectDescription =
    ((formData.get("project_description") as string) ?? "").trim();

  if (role && !ALLOWED_ROLES.has(role)) {
    return { error: "Pick a role (or skip the question)" };
  }
  if (bio.length > MAX_BIO) {
    return { error: `Bio must be ${MAX_BIO} chars or fewer` };
  }
  if (goal.length > MAX_GOAL) {
    return { error: `Goal must be ${MAX_GOAL} chars or fewer` };
  }
  if (projectName && projectName.length > MAX_PROJECT_NAME) {
    return { error: `Project name must be ${MAX_PROJECT_NAME} chars or fewer` };
  }
  if (
    projectDescription &&
    projectDescription.length > MAX_PROJECT_DESCRIPTION
  ) {
    return {
      error: `Project description must be ${MAX_PROJECT_DESCRIPTION} chars or fewer`,
    };
  }
  if (projectName && !projectType) {
    return { error: "Pick a project type" };
  }
  if (projectType && !ALLOWED_PROJECT_TYPES.has(projectType)) {
    return { error: "Project type isn't valid" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Build the fact rows. Pinned so they stick around even past the
  // 100-fact cap — these are the user's core profile.
  const factRows: Array<{
    user_id: string;
    fact: string;
    pinned: boolean;
    source_project_id: null;
  }> = [];

  if (role) {
    factRows.push({
      user_id: user.id,
      fact: `I'm here as a ${ROLE_LABELS[role]}.`,
      pinned: true,
      source_project_id: null,
    });
  }
  if (bio) {
    factRows.push({
      user_id: user.id,
      fact: `About me: ${bio}`,
      pinned: true,
      source_project_id: null,
    });
  }
  if (goal) {
    factRows.push({
      user_id: user.id,
      fact: `What I'm trying to do: ${goal}`,
      pinned: true,
      source_project_id: null,
    });
  }

  if (factRows.length > 0) {
    await supabase.from("user_facts").insert(factRows);
  }

  let projectId: string | undefined;
  if (projectName && projectType) {
    const { data: project } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name: projectName,
        project_type: projectType,
        description: projectDescription || null,
        status: "active",
      })
      .select("id")
      .single();
    if (project) projectId = project.id;
  }

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath("/welcome");

  return { ok: true, projectId };
}

/**
 * Convenience: from the welcome page's Skip button, just send users
 * to the dashboard. Server-side redirect so the URL changes cleanly.
 */
export async function skipWelcome() {
  redirect("/dashboard");
}

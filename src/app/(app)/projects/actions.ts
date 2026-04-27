"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { PROJECT_TYPES, type ProjectType } from "@/types/project";

function isProjectType(value: string): value is ProjectType {
  return (PROJECT_TYPES as readonly string[]).includes(value);
}

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = ((formData.get("name") as string) ?? "").trim();
  const description = ((formData.get("description") as string) ?? "").trim();
  const rawType = ((formData.get("project_type") as string) ?? "").trim();

  if (!name) {
    redirect(
      `/projects/new?error=${encodeURIComponent("Name is required.")}`,
    );
  }
  if (name.length > 100) {
    redirect(
      `/projects/new?error=${encodeURIComponent(
        "Name must be 100 characters or fewer.",
      )}`,
    );
  }
  if (!isProjectType(rawType)) {
    redirect(
      `/projects/new?error=${encodeURIComponent("Please choose a project type.")}`,
    );
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name,
      description: description.length > 0 ? description : null,
      project_type: rawType,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(
      `/projects/new?error=${encodeURIComponent(
        error?.message ?? "Could not create project.",
      )}`,
    );
  }

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  redirect(`/projects/${data.id}`);
}

export async function updateProjectField(formData: FormData) {
  const id = formData.get("id") as string;
  const field = formData.get("field") as string;
  const rawValue = ((formData.get("value") as string) ?? "").trim();

  if (!id || !field) return;

  const update: { name?: string; description?: string | null } = {};
  if (field === "name") {
    if (rawValue.length === 0 || rawValue.length > 100) return;
    update.name = rawValue;
  } else if (field === "description") {
    update.description = rawValue.length > 0 ? rawValue : null;
  } else {
    return;
  }

  const supabase = await createClient();
  await supabase.from("projects").update(update).eq("id", id);

  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

export async function toggleArchiveProject(formData: FormData) {
  const id = formData.get("id") as string;
  const currentStatus = formData.get("current_status") as string;
  if (!id) return;

  const newStatus = currentStatus === "archived" ? "active" : "archived";

  const supabase = await createClient();
  await supabase
    .from("projects")
    .update({ status: newStatus })
    .eq("id", id);

  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

export async function deleteProject(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("projects").delete().eq("id", id);

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  redirect("/projects");
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { generateAuditSummary } from "@/lib/work/generate-audit";

const MAX_JOB_TITLE = 200;
const MAX_LONG = 2000;

export interface CreateAuditResult {
  auditId?: string;
  error?: string;
}

/**
 * Create a new job audit row, then call the model to generate a
 * personalised summary, then write the summary back. The two-write
 * shape (insert empty → generate → update with summary) means a
 * generation failure leaves a usable row the user can retry from.
 */
export async function createJobAudit(
  formData: FormData,
): Promise<CreateAuditResult> {
  const jobTitle = ((formData.get("job_title") as string) ?? "").trim();
  const responsibilities =
    ((formData.get("responsibilities") as string) ?? "").trim();
  const topTasks = ((formData.get("top_tasks") as string) ?? "").trim();
  const worries = ((formData.get("worries") as string) ?? "").trim();
  const hopes = ((formData.get("hopes") as string) ?? "").trim();

  if (!jobTitle) return { error: "Tell us your job title" };
  if (jobTitle.length > MAX_JOB_TITLE) {
    return { error: `Job title must be ${MAX_JOB_TITLE} characters or fewer` };
  }
  for (const [name, value] of [
    ["Responsibilities", responsibilities],
    ["Top tasks", topTasks],
    ["Worries", worries],
    ["Hopes", hopes],
  ] as const) {
    if (value.length > MAX_LONG) {
      return { error: `${name} must be ${MAX_LONG} characters or fewer` };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Insert the audit row first so we have an ID to redirect to even
  // if generation fails partway.
  const { data: row, error: insertErr } = await supabase
    .from("job_audits")
    .insert({
      user_id: user.id,
      job_title: jobTitle,
      responsibilities: responsibilities || null,
      top_tasks: topTasks || null,
      worries: worries || null,
      hopes: hopes || null,
    })
    .select("id")
    .single();

  if (insertErr || !row) {
    return { error: "Could not save your audit — try again." };
  }

  const result = await generateAuditSummary(supabase, {
    jobTitle,
    responsibilities: responsibilities || null,
    topTasks: topTasks || null,
    worries: worries || null,
    hopes: hopes || null,
  });

  if (result.summary) {
    await supabase
      .from("job_audits")
      .update({
        summary: result.summary,
        model: result.model ?? null,
      })
      .eq("id", row.id)
      .eq("user_id", user.id);
  }

  revalidatePath("/me/work");
  revalidatePath(`/me/work/audit/${row.id}`);

  if (result.error) {
    // Still return the audit id so the user lands on the detail page;
    // it'll show a "generation failed — retry" affordance.
    return { auditId: row.id, error: result.error };
  }

  return { auditId: row.id };
}

export async function regenerateAuditSummary(formData: FormData) {
  const id = ((formData.get("id") as string) ?? "").trim();
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: audit } = await supabase
    .from("job_audits")
    .select(
      "id, job_title, responsibilities, top_tasks, worries, hopes, user_id",
    )
    .eq("id", id)
    .maybeSingle();
  if (!audit || audit.user_id !== user.id) return;

  const result = await generateAuditSummary(supabase, {
    jobTitle: audit.job_title as string,
    responsibilities: (audit.responsibilities as string | null) ?? null,
    topTasks: (audit.top_tasks as string | null) ?? null,
    worries: (audit.worries as string | null) ?? null,
    hopes: (audit.hopes as string | null) ?? null,
  });

  if (result.summary) {
    await supabase
      .from("job_audits")
      .update({
        summary: result.summary,
        model: result.model ?? null,
      })
      .eq("id", id)
      .eq("user_id", user.id);
  }

  revalidatePath(`/me/work/audit/${id}`);
}

export async function deleteJobAudit(formData: FormData) {
  const id = ((formData.get("id") as string) ?? "").trim();
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("job_audits")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/me/work");
  redirect("/me/work");
}

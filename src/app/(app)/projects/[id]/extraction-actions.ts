"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  extractFactsForProject,
  type ExtractionResult,
} from "@/lib/coach/extract-facts";

/**
 * Manual extraction trigger. Admin-gated via ADMIN_USER_ID env var.
 * Runs the same extraction logic the nightly cron uses, but for a single
 * project, using the user's authenticated supabase client (so RLS still
 * applies — no admin powers escalation).
 *
 * This action is intended to be removed (or moved to an admin-only page)
 * before public signups.
 */
export async function manuallyExtractFacts(
  projectId: string,
): Promise<ExtractionResult | { error: string }> {
  if (!projectId) return { error: "Missing project id" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Admin gate — bypassed in E2E_TEST_MODE so tests can exercise extraction
  // without impersonating the admin user. Production never sets E2E_TEST_MODE.
  const isTestMode = process.env.E2E_TEST_MODE === "true";
  const adminId = process.env.ADMIN_USER_ID;
  if (!isTestMode && (!adminId || user.id !== adminId)) {
    return { error: "Not authorized" };
  }

  // Verify the user owns this project (RLS would also enforce, but explicit).
  const { data: project } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project || project.user_id !== user.id) {
    return { error: "Project not found" };
  }

  const result = await extractFactsForProject(supabase, projectId);
  revalidatePath(`/projects/${projectId}`);
  return result;
}

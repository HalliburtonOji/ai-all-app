import { NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import {
  extractFactsForProject,
  type ExtractionResult,
} from "@/lib/coach/extract-facts";
import {
  extractUserFacts,
  type UserExtractionResult,
} from "@/lib/coach/extract-user-facts";

// Force dynamic — never cache.
export const dynamic = "force-dynamic";

// Hard cap so a misconfigured cron doesn't fan out forever.
const MAX_PROJECTS_PER_RUN = 100;

export async function GET(request: Request) {
  // Auth: Vercel cron sends `Authorization: Bearer <CRON_SECRET>` when the
  // env var is set in the Vercel project. We refuse anything else.
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured on server" },
      { status: 500 },
    );
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Cron needs to read across users → service-role client (bypasses RLS).
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    return NextResponse.json(
      { error: "Supabase env vars missing on server" },
      { status: 500 },
    );
  }

  const supabase = createSupabaseAdminClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Get every project. The extract function early-exits if there are no
  // new messages, so this is cheap for most projects.
  const { data: projects, error: projErr } = await supabase
    .from("projects")
    .select("id")
    .limit(MAX_PROJECTS_PER_RUN);

  if (projErr) {
    return NextResponse.json({ error: projErr.message }, { status: 500 });
  }

  const projectResults: ExtractionResult[] = [];
  for (const project of projects ?? []) {
    const r = await extractFactsForProject(supabase, project.id);
    projectResults.push(r);
  }

  // After project-level extraction, run user-level extraction for every
  // user that has at least one project. The first SELECT only fetched id,
  // so re-fetch user_id distinct to drive the user pass.
  const { data: projectsWithUsers } = await supabase
    .from("projects")
    .select("user_id")
    .limit(MAX_PROJECTS_PER_RUN);
  const distinctUserIds = Array.from(
    new Set(
      ((projectsWithUsers ?? []) as { user_id: string }[]).map((p) => p.user_id),
    ),
  );

  const userResults: UserExtractionResult[] = [];
  for (const userId of distinctUserIds) {
    const r = await extractUserFacts(supabase, userId);
    userResults.push(r);
  }

  const summary = {
    projectsScanned: projectResults.length,
    projectsWithNewFacts: projectResults.filter((r) => r.newFactsCount > 0).length,
    totalNewProjectFacts: projectResults.reduce((sum, r) => sum + r.newFactsCount, 0),
    totalDroppedProjectFacts: projectResults.reduce((sum, r) => sum + r.droppedFactsCount, 0),
    usersScanned: userResults.length,
    usersWithNewFacts: userResults.filter((r) => r.newFactsCount > 0).length,
    totalNewUserFacts: userResults.reduce((sum, r) => sum + r.newFactsCount, 0),
    totalDroppedUserFacts: userResults.reduce((sum, r) => sum + r.droppedFactsCount, 0),
    projectErrors: projectResults.filter((r) => r.error).length,
    userErrors: userResults.filter((r) => r.error).length,
  };

  return NextResponse.json({
    summary,
    projectResults,
    userResults,
  });
}


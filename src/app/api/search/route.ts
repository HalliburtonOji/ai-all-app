import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getAllLessons } from "@/lib/learn/lessons";
import { getAllProfessionPacks } from "@/lib/work/packs";

export const dynamic = "force-dynamic";

const MAX_PER_CATEGORY = 6;

export interface SearchResult {
  projects: Array<{ id: string; name: string; type: string }>;
  conversations: Array<{ id: string; project_id: string; title: string }>;
  lessons: Array<{
    slug: string;
    title: string;
    branch: string;
    summary: string;
  }>;
  packs: Array<{ slug: string; title: string; summary: string }>;
  audits: Array<{ id: string; job_title: string }>;
  clients: Array<{ id: string; name: string; company: string | null }>;
}

const EMPTY_RESULT: SearchResult = {
  projects: [],
  conversations: [],
  lessons: [],
  packs: [],
  audits: [],
  clients: [],
};

/**
 * Cmd-K search across the user's data + the app's content.
 * Authenticated; RLS scopes everything to the calling user.
 *
 * v1 scope: titles and short fields only. Full message-text search
 * is out of scope until we have a real index.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (!q || q.length < 2) {
    return NextResponse.json(EMPTY_RESULT);
  }
  if (q.length > 200) {
    return NextResponse.json(EMPTY_RESULT);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // PostgreSQL ilike pattern with escaped wildcards. The user-provided
  // string is parameterised by Supabase's query builder, but we still
  // escape % and _ so a user typing "50%" doesn't get a wildcard.
  const safe = q.replace(/[%_]/g, "\\$&");
  const pattern = `%${safe}%`;

  const [
    { data: projectRows },
    { data: convoRows },
    { data: auditRows },
    { data: clientRows },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, project_type, description")
      .or(`name.ilike.${pattern},description.ilike.${pattern}`)
      .order("updated_at", { ascending: false })
      .limit(MAX_PER_CATEGORY),
    supabase
      .from("conversations")
      .select("id, project_id, title")
      .ilike("title", pattern)
      .order("updated_at", { ascending: false })
      .limit(MAX_PER_CATEGORY),
    supabase
      .from("job_audits")
      .select("id, job_title")
      .ilike("job_title", pattern)
      .order("created_at", { ascending: false })
      .limit(MAX_PER_CATEGORY),
    supabase
      .from("clients")
      .select("id, name, company")
      .or(`name.ilike.${pattern},company.ilike.${pattern}`)
      .order("created_at", { ascending: false })
      .limit(MAX_PER_CATEGORY),
  ]);

  // Lessons + packs come from the in-process content registry.
  const lower = q.toLowerCase();
  const lessons = getAllLessons()
    .filter(
      (l) =>
        l.title.toLowerCase().includes(lower) ||
        l.summary.toLowerCase().includes(lower),
    )
    .slice(0, MAX_PER_CATEGORY)
    .map((l) => ({
      slug: l.slug,
      title: l.title,
      branch: l.branch,
      summary: l.summary,
    }));

  const packs = getAllProfessionPacks()
    .filter(
      (p) =>
        p.title.toLowerCase().includes(lower) ||
        p.summary.toLowerCase().includes(lower),
    )
    .slice(0, MAX_PER_CATEGORY)
    .map((p) => ({ slug: p.slug, title: p.title, summary: p.summary }));

  return NextResponse.json({
    projects: ((projectRows ?? []) as Array<{
      id: string;
      name: string;
      project_type: string;
    }>).map((p) => ({
      id: p.id,
      name: p.name,
      type: p.project_type,
    })),
    conversations: (convoRows ?? []) as Array<{
      id: string;
      project_id: string;
      title: string;
    }>,
    lessons,
    packs,
    audits: (auditRows ?? []) as Array<{
      id: string;
      job_title: string;
    }>,
    clients: (clientRows ?? []) as Array<{
      id: string;
      name: string;
      company: string | null;
    }>,
  } satisfies SearchResult);
}

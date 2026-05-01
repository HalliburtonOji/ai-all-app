import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { ProjectCard } from "@/components/ProjectCard";
import type { Project } from "@/types/project";
import type { UserFact } from "@/types/coach";
import { UserMemoryPanel } from "./UserMemoryPanel";
import { getFirstLesson } from "@/lib/learn/lessons";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: projects },
    { data: userFactRows },
    { data: meta },
    { data: lessonProgressRows },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(3),
    supabase
      .from("user_facts")
      .select("id, fact, source_project_id, pinned, created_at, updated_at")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("user_meta")
      .select("user_facts_last_extracted_at")
      .maybeSingle(),
    supabase.from("user_lesson_progress").select("lesson_slug").limit(1),
  ]);

  const hasAnyLessonProgress =
    !!lessonProgressRows && lessonProgressRows.length > 0;
  const firstLesson = getFirstLesson();

  const recentProjects: Project[] = projects ?? [];
  const userFacts: UserFact[] = (userFactRows ?? []) as UserFact[];
  const hasExtractedYet =
    !!meta && meta.user_facts_last_extracted_at !== null;
  const isAdmin =
    !!user &&
    ((!!process.env.ADMIN_USER_ID && user.id === process.env.ADMIN_USER_ID) ||
      process.env.E2E_TEST_MODE === "true");

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl dark:text-white">
            Welcome, {user?.email}
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Your AI workshop, classroom, and earnings hub.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="self-start rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 sm:self-auto dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          + New Project
        </Link>
      </div>

      <UserMemoryPanel
        facts={userFacts}
        hasExtractedYet={hasExtractedYet}
        isAdmin={isAdmin}
      />

      {!hasAnyLessonProgress && (
        <section
          data-dashboard-suggested-lesson="true"
          className="mt-8 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Suggested for you
          </p>
          <h2 className="mt-1 text-lg font-semibold text-black dark:text-white">
            Start with: {firstLesson.title}
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {firstLesson.summary}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
            <span>{firstLesson.estimated_minutes} min</span>
            <span aria-hidden>·</span>
            <Link
              href={`/learn/${firstLesson.slug}`}
              data-dashboard-suggested-lesson-link="true"
              className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Open lesson
            </Link>
            <Link
              href="/learn"
              className="text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
            >
              Browse all lessons
            </Link>
          </div>
        </section>
      )}

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            Recent projects
          </h2>
          {recentProjects.length > 0 && (
            <Link
              href="/projects"
              className="text-sm font-medium text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
            >
              View all projects →
            </Link>
          )}
        </div>

        {recentProjects.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-950">
            <p className="text-zinc-600 dark:text-zinc-400">
              You don&apos;t have any projects yet.
            </p>
            <Link
              href="/projects/new"
              className="mt-3 inline-block text-sm font-medium text-black underline dark:text-white"
            >
              Create your first project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentProjects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

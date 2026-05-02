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
  // Show the welcome banner for users who haven't shared anything
  // about themselves yet (no user_facts). Welcome flow inserts at
  // least one fact, so the banner naturally disappears once
  // they finish — without a separate "completed" flag.
  const hasUserFacts = userFactRows && userFactRows.length > 0;

  const recentProjects: Project[] = projects ?? [];
  const userFacts: UserFact[] = (userFactRows ?? []) as UserFact[];
  const hasExtractedYet =
    !!meta && meta.user_facts_last_extracted_at !== null;
  const isAdmin =
    !!user &&
    ((!!process.env.ADMIN_USER_ID && user.id === process.env.ADMIN_USER_ID) ||
      process.env.E2E_TEST_MODE === "true");

  // Friendly first-name fallback from email prefix.
  const greetingName = (user?.email ?? "").split("@")[0]?.split(/[._+]/)[0];

  const layerShortcuts = [
    {
      href: "/projects",
      label: "Projects",
      blurb: "Coach + Studio",
      color: "var(--coach-accent)",
    },
    {
      href: "/learn",
      label: "Learn",
      blurb: "12 lessons, 3 branches",
      color: "var(--learn-accent)",
    },
    {
      href: "/me/work",
      label: "Work",
      blurb: "Audit + profession packs",
      color: "var(--work-accent)",
    },
    {
      href: "/me/earnings",
      label: "Earn",
      blurb: "Income tracker + clients",
      color: "var(--earn-accent)",
    },
    {
      href: "/wins",
      label: "Wins",
      blurb: "What people are shipping",
      color: "var(--community-accent)",
    },
    {
      href: "/me/keys",
      label: "Settings",
      blurb: "BYOK keys",
      color: "var(--brand)",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Dashboard
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-black sm:text-4xl dark:text-white">
            Welcome
            {greetingName ? <span>, {greetingName}</span> : null}.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
            Pick up a Project, learn something new, or just open the coach and
            think out loud.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="self-start rounded-md bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--brand-strong)] sm:self-auto"
        >
          + New Project
        </Link>
      </div>

      {!hasUserFacts && (
        <section
          data-dashboard-welcome-banner="true"
          className="mt-8 overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--surface)]"
        >
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--brand-strong)]">
                Get the most out of the coach
              </p>
              <h2 className="mt-1 text-lg font-semibold text-[var(--foreground)]">
                Spend 90 seconds telling us about you
              </h2>
              <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                The coach gives sharper, less-generic answers when it knows what
                you&apos;re trying to do. Skip anything you don&apos;t want to
                share.
              </p>
            </div>
            <Link
              href="/welcome"
              data-dashboard-welcome-link="true"
              className="shrink-0 rounded-md bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--brand-strong)]"
            >
              Start the 3 questions
            </Link>
          </div>
          <div
            aria-hidden
            className="h-1 w-full"
            style={{
              background:
                "linear-gradient(90deg, var(--brand) 0%, var(--accent) 100%)",
            }}
          />
        </section>
      )}

      <section className="mt-8">
        <h2 className="sr-only">Shortcuts</h2>
        <ul
          data-dashboard-layer-shortcuts="true"
          className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6"
        >
          {layerShortcuts.map((s) => (
            <li key={s.href}>
              <Link
                href={s.href}
                className="group flex h-full flex-col items-start gap-1 rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] p-3 transition-colors hover:border-[var(--border-strong)]"
              >
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: s.color }}
                />
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  {s.label}
                </span>
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  {s.blurb}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <UserMemoryPanel
        facts={userFacts}
        hasExtractedYet={hasExtractedYet}
        isAdmin={isAdmin}
      />

      {!hasAnyLessonProgress && (
        <section
          data-dashboard-suggested-lesson="true"
          className="mt-8 rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-5"
        >
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: "var(--learn-accent)" }}
            />
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Suggested lesson
            </p>
          </div>
          <h2 className="mt-2 text-lg font-semibold text-[var(--foreground)]">
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
              className="rounded-md bg-[var(--brand)] px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--brand-strong)]"
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
          <div className="rounded-xl border border-dashed border-[var(--border-soft)] bg-[var(--surface)] p-8 text-center">
            <p className="text-base font-medium text-[var(--foreground)]">
              No projects yet.
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
              A Project is a container — channel, freelance practice, product,
              job hunt. Start with one and the coach has somewhere to think
              with you.
            </p>
            <Link
              href="/projects/new"
              className="mt-4 inline-block rounded-md bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--brand-strong)]"
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

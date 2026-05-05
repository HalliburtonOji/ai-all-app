import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getAllLessons } from "@/lib/learn/lessons";
import {
  BRANCH_DESCRIPTIONS,
  BRANCH_LABELS,
  BRANCH_ORDER,
  type LearnBranch,
  type LessonProgressStatus,
} from "@/types/learn";

export default async function LearnIndexPage() {
  const lessons = getAllLessons();

  const supabase = await createClient();
  const { data: progressRows } = await supabase
    .from("user_lesson_progress")
    .select("lesson_slug, status");

  const progressBySlug: Record<string, LessonProgressStatus> = {};
  for (const r of (progressRows ?? []) as Array<{
    lesson_slug: string;
    status: LessonProgressStatus;
  }>) {
    progressBySlug[r.lesson_slug] = r.status;
  }

  const completedCount = Object.values(progressBySlug).filter(
    (s) => s === "completed",
  ).length;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--brand-strong)] shadow-sm">
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: "var(--learn-accent)" }}
        />
        Learn
      </div>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold leading-[0.95] tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
            Get genuinely good at AI
          </h1>
          <p className="mt-4 max-w-2xl text-base text-zinc-700 dark:text-zinc-300">
            Short, grounded lessons. No hype, no grift, no doom — just the
            mental models that actually help you do good work with AI.
          </p>
        </div>
        <p
          data-learn-progress-summary="true"
          className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500"
        >
          {completedCount} of {lessons.length} lessons complete
        </p>
      </div>

      <div className="mt-12 space-y-12">
        {BRANCH_ORDER.map((branch) => (
          <BranchSection
            key={branch}
            branch={branch}
            lessons={lessons.filter((l) => l.branch === branch)}
            progress={progressBySlug}
          />
        ))}
      </div>
    </main>
  );
}

function BranchSection({
  branch,
  lessons,
  progress,
}: {
  branch: LearnBranch;
  lessons: ReturnType<typeof getAllLessons>;
  progress: Record<string, LessonProgressStatus>;
}) {
  return (
    <section data-learn-branch={branch}>
      <div className="flex items-baseline gap-3">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
          {BRANCH_LABELS[branch]}
        </h2>
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
          {String(BRANCH_ORDER.indexOf(branch) + 1).padStart(2, "0")}
        </span>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-zinc-700 dark:text-zinc-300">
        {BRANCH_DESCRIPTIONS[branch]}
      </p>
      {lessons.length === 0 ? (
        <p className="mt-3 text-sm italic text-zinc-500">
          More lessons in this branch are on the way.
        </p>
      ) : (
        <ul
          data-learn-branch-list={branch}
          className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {lessons.map((lesson) => {
            const status = progress[lesson.slug];
            return (
              <li key={lesson.slug}>
                <Link
                  href={`/learn/${lesson.slug}`}
                  data-lesson-slug={lesson.slug}
                  data-lesson-status={status ?? "unstarted"}
                  className="bento-tile block h-full rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                      Lesson {lesson.order} · {lesson.estimated_minutes} min
                    </p>
                    <ProgressBadge status={status} />
                  </div>
                  <h3 className="mt-3 text-lg font-semibold leading-tight text-[var(--foreground)]">
                    {lesson.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                    {lesson.summary}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function ProgressBadge({ status }: { status?: LessonProgressStatus }) {
  if (status === "completed") {
    return (
      <span
        data-lesson-badge="completed"
        className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
      >
        Done
      </span>
    );
  }
  if (status === "started") {
    return (
      <span
        data-lesson-badge="started"
        className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
      >
        In progress
      </span>
    );
  }
  return null;
}

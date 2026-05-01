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
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Learn
      </p>
      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl dark:text-white">
          Get genuinely good at AI
        </h1>
        <p
          data-learn-progress-summary="true"
          className="text-sm text-zinc-600 dark:text-zinc-400"
        >
          {completedCount} of {lessons.length} lessons complete
        </p>
      </div>
      <p className="mt-2 max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
        Short, grounded lessons. No hype, no grift, no doom — just the
        mental models that actually help you do good work with AI.
      </p>

      <div className="mt-8 space-y-10">
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
      <h2 className="text-xl font-semibold text-black dark:text-white">
        {BRANCH_LABELS[branch]}
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {BRANCH_DESCRIPTIONS[branch]}
      </p>
      {lessons.length === 0 ? (
        <p className="mt-3 text-sm italic text-zinc-500">
          More lessons in this branch are on the way.
        </p>
      ) : (
        <ul
          data-learn-branch-list={branch}
          className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {lessons.map((lesson) => {
            const status = progress[lesson.slug];
            return (
              <li key={lesson.slug}>
                <Link
                  href={`/learn/${lesson.slug}`}
                  data-lesson-slug={lesson.slug}
                  data-lesson-status={status ?? "unstarted"}
                  className="block h-full rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Lesson {lesson.order} · {lesson.estimated_minutes} min
                    </p>
                    <ProgressBadge status={status} />
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-black dark:text-white">
                    {lesson.title}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
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

import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { createClient } from "@/utils/supabase/server";
import {
  getAllLessons,
  getLessonBySlug,
} from "@/lib/learn/lessons";
import { BRANCH_LABELS, type LessonProgressStatus } from "@/types/learn";
import { setLessonComplete } from "../actions";
import { LessonTutor } from "../LessonTutor";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function LessonPage({ params }: PageProps) {
  const { slug } = await params;
  const lesson = getLessonBySlug(slug);
  if (!lesson) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Auto-mark as 'started' on first view. Inline insert (not a server
  // action with revalidatePath — that's not allowed during render).
  // Best-effort; if the insert races with another request we ignore.
  let { data: progressRow } = await supabase
    .from("user_lesson_progress")
    .select("status")
    .eq("lesson_slug", slug)
    .maybeSingle();

  if (!progressRow && user) {
    const { data: inserted } = await supabase
      .from("user_lesson_progress")
      .insert({
        user_id: user.id,
        lesson_slug: slug,
        status: "started",
      })
      .select("status")
      .single();
    progressRow = inserted ?? { status: "started" };
  }

  const status = (progressRow?.status ?? "started") as LessonProgressStatus;
  const isComplete = status === "completed";

  // Find next lesson in catalog order for the "Up next" link.
  const all = getAllLessons();
  const idx = all.findIndex((l) => l.slug === slug);
  const next = idx >= 0 && idx + 1 < all.length ? all[idx + 1] : null;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <Link
        href="/learn"
        className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
      >
        ← Back to lessons
      </Link>

      <header className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {BRANCH_LABELS[lesson.branch]} · Lesson {lesson.order} ·{" "}
          {lesson.estimated_minutes} min
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-black sm:text-4xl dark:text-white">
          {lesson.title}
        </h1>
        <p className="mt-2 max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
          {lesson.summary}
        </p>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article
          data-lesson-body="true"
          data-lesson-slug={lesson.slug}
          className="prose prose-zinc max-w-none dark:prose-invert prose-headings:font-semibold prose-h2:mt-8 prose-h2:text-xl prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-a:text-black dark:prose-a:text-white prose-strong:text-black dark:prose-strong:text-white"
        >
          <ReactMarkdown>{lesson.body}</ReactMarkdown>
        </article>

        <aside className="space-y-4">
          <section
            data-lesson-status-card="true"
            data-lesson-status={status}
            className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <h2 className="text-sm font-semibold text-black dark:text-white">
              {isComplete ? "You finished this one." : "On your plate"}
            </h2>
            <form action={setLessonComplete} className="mt-3">
              <input type="hidden" name="slug" value={lesson.slug} />
              <input
                type="hidden"
                name="completed"
                value={isComplete ? "false" : "true"}
              />
              <button
                type="submit"
                data-lesson-toggle-complete="true"
                className={
                  isComplete
                    ? "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
                    : "w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                }
              >
                {isComplete ? "Mark as not done" : "Mark as complete"}
              </button>
            </form>
            {next && (
              <Link
                href={`/learn/${next.slug}`}
                data-lesson-next="true"
                className="mt-3 block text-xs text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
              >
                Up next: {next.title} →
              </Link>
            )}
          </section>

          <LessonTutor
            lessonSlug={lesson.slug}
            lessonTitle={lesson.title}
            lessonSummary={lesson.summary}
          />
        </aside>
      </div>
    </main>
  );
}

export function generateStaticParams() {
  return getAllLessons().map((l) => ({ slug: l.slug }));
}

import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { createClient } from "@/utils/supabase/server";
import {
  getAllLessons,
  getLessonBySlug,
} from "@/lib/learn/lessons";
import { BRANCH_LABELS, type LessonProgressStatus } from "@/types/learn";
import { LessonTutor } from "../LessonTutor";
import { LessonCompleteToggle } from "./LessonCompleteToggle";
import { LessonExercise } from "./LessonExercise";
import { LessonActions } from "./LessonActions";

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
    <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href="/learn"
        className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
      >
        ← Back to lessons
      </Link>

      <header className="mt-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--brand-strong)] shadow-sm">
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--learn-accent)" }}
          />
          {BRANCH_LABELS[lesson.branch]} · Lesson {lesson.order} ·{" "}
          {lesson.estimated_minutes} min
        </div>
        <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
          {lesson.title}
        </h1>
        <p className="mt-4 max-w-2xl text-base text-zinc-700 dark:text-zinc-300">
          {lesson.summary}
        </p>
      </header>

      <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <article
          data-lesson-body="true"
          data-lesson-slug={lesson.slug}
          className="prose prose-zinc max-w-none dark:prose-invert prose-headings:font-semibold prose-h2:mt-10 prose-h2:text-2xl prose-h2:tracking-tight prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-a:text-[var(--brand-strong)] prose-strong:text-[var(--foreground)]"
        >
          <ReactMarkdown>{lesson.body}</ReactMarkdown>
          {lesson.try_it_actions.length > 0 && (
            <LessonActions
              actions={lesson.try_it_actions}
              lessonSlug={lesson.slug}
            />
          )}
          {lesson.try_it_rubric && (
            <LessonExercise
              lessonSlug={lesson.slug}
              prompt={lesson.try_it_prompt}
            />
          )}
        </article>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section
            data-lesson-status-card="true"
            data-lesson-status={status}
            className="bento-tile rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-5"
          >
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              {isComplete ? "Done" : "On your plate"}
            </h2>
            <LessonCompleteToggle
              slug={lesson.slug}
              isComplete={isComplete}
            />
            {next && (
              <Link
                href={`/learn/${next.slug}`}
                data-lesson-next="true"
                className="mt-4 block text-xs text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
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

"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { LessonAction, LessonActionKind } from "@/types/learn";

const PENDING_KEY = "ai-all-app:pending-lesson-action";

const KIND_META: Record<
  LessonActionKind,
  { label: string; color: string; verb: string }
> = {
  studio_text: {
    label: "Studio · Text",
    color: "var(--studio-accent)",
    verb: "Try this in Studio",
  },
  coach: {
    label: "Coach",
    color: "var(--coach-accent)",
    verb: "Ask the coach",
  },
  studio_image: {
    label: "Studio · Image",
    color: "var(--studio-accent)",
    verb: "Make this image",
  },
  start_project: {
    label: "Start a project",
    color: "var(--brand)",
    verb: "Start a project for this",
  },
};

interface PendingAction {
  kind: LessonActionKind;
  prompt: string;
  source: string;
  ts: number;
}

export function LessonActions({
  actions,
  lessonSlug,
}: {
  actions: LessonAction[];
  lessonSlug: string;
}) {
  const router = useRouter();
  if (actions.length === 0) return null;

  function onActionClick(action: LessonAction) {
    if (action.kind === "start_project") {
      // Plain navigation, no pending state needed.
      router.push("/projects/new");
      return;
    }
    const pending: PendingAction = {
      kind: action.kind,
      prompt: action.prompt,
      source: `lesson:${lessonSlug}`,
      ts: Date.now(),
    };
    try {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
    } catch {
      // sessionStorage unavailable — fall through to a direct nav so
      // the user still gets somewhere useful.
    }
    router.push("/projects?pending_action=1");
  }

  return (
    <aside
      data-lesson-actions="true"
      className="my-8 rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-5"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Try it now
      </p>
      <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
        Reading helps. Doing helps more. Pick one — you can come back.
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {actions.map((action, i) => {
          const meta = KIND_META[action.kind];
          const content = (
            <>
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: meta.color }}
              />
              <span className="text-sm font-medium text-[var(--foreground)]">
                {action.label}
              </span>
              <span className="ml-1 text-xs text-zinc-500">
                {meta.label}
              </span>
            </>
          );
          if (action.kind === "start_project") {
            return (
              <li key={i}>
                <Link
                  href="/projects/new"
                  data-lesson-action-kind={action.kind}
                  className="bento-tile inline-flex items-center gap-2 rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-2"
                >
                  {content}
                </Link>
              </li>
            );
          }
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => onActionClick(action)}
                data-lesson-action-kind={action.kind}
                data-lesson-action-prompt={action.prompt}
                className="bento-tile inline-flex items-center gap-2 rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-2 text-left"
              >
                {content}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { LessonActionKind } from "@/types/learn";

const PENDING_KEY = "ai-all-app:pending-lesson-action";

type ProjectScopedActionKind = Exclude<LessonActionKind, "start_project">;

interface PendingAction {
  kind: ProjectScopedActionKind;
  prompt: string;
  source: string;
  ts: number;
}

const KIND_DESTINATION: Record<
  ProjectScopedActionKind,
  { tabSearch: string; verb: string }
> = {
  studio_text: {
    tabSearch: "tab=studio&studio=text",
    verb: "Drop into Studio · Text",
  },
  studio_image: {
    tabSearch: "tab=studio&studio=image",
    verb: "Drop into Studio · Image",
  },
  coach: {
    tabSearch: "",
    verb: "Drop into Coach",
  },
};

/**
 * When the reader clicks an action chip on a lesson page, the
 * action gets stashed in sessionStorage and they land here. We read
 * it on mount and inject a "Use here" button onto every project
 * card so they can pick where the prefilled prompt should land.
 */
export function PendingActionBanner({
  projectIds,
}: {
  projectIds: string[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<PendingAction | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PENDING_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PendingAction;
      // Stale guard: ignore anything older than 30 minutes.
      if (Date.now() - parsed.ts > 30 * 60 * 1000) {
        sessionStorage.removeItem(PENDING_KEY);
        return;
      }
      setPending(parsed);
    } catch {
      // Bad JSON / unavailable storage — silently ignore.
    }
  }, []);

  // Wire each project card with a "Use here" overlay button. We
  // attach via DOM lookup rather than a prop drill so the banner
  // stays opt-in and doesn't bloat the regular ProjectCard.
  useEffect(() => {
    if (!pending) return;
    const buttons: HTMLButtonElement[] = [];
    for (const id of projectIds) {
      const card = document.querySelector<HTMLElement>(
        `[data-project-card="${id}"]`,
      );
      if (!card) continue;
      // Avoid double-mounting on hot reload.
      if (card.querySelector("[data-pending-action-button]")) continue;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.pendingActionButton = "true";
      btn.className =
        "absolute inset-x-3 bottom-3 rounded-md bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-[var(--brand-strong)] z-20";
      btn.textContent = "Use this project →";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        usePendingActionOnProject(id);
      });
      // Make the card a positioning context if it isn't already.
      const positionStyle = window.getComputedStyle(card).position;
      if (positionStyle === "static") {
        card.style.position = "relative";
      }
      card.appendChild(btn);
      buttons.push(btn);
    }
    return () => {
      for (const btn of buttons) btn.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, projectIds.join(",")]);

  function usePendingActionOnProject(projectId: string) {
    if (!pending) return;
    sessionStorage.removeItem(PENDING_KEY);
    if (pending.kind === "coach") {
      const params = new URLSearchParams();
      params.set("prefill", pending.prompt);
      router.push(`/projects/${projectId}?${params.toString()}`);
      return;
    }
    const dest = KIND_DESTINATION[pending.kind];
    if (!dest) return;
    const params = new URLSearchParams(dest.tabSearch);
    params.set("prefill", pending.prompt);
    router.push(`/projects/${projectId}?${params.toString()}`);
  }

  function dismiss() {
    sessionStorage.removeItem(PENDING_KEY);
    setPending(null);
  }

  if (!pending) return null;

  const verb =
    pending.kind === "coach"
      ? KIND_DESTINATION.coach.verb
      : pending.kind === "studio_image"
        ? KIND_DESTINATION.studio_image.verb
        : KIND_DESTINATION.studio_text.verb;

  return (
    <aside
      data-pending-action-banner="true"
      className="mt-6 overflow-hidden rounded-xl border border-[var(--brand-strong)] bg-[var(--brand-soft)] p-4 text-[var(--brand-ink)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-strong)]">
            From your lesson — pick a project
          </p>
          <p className="mt-1 text-sm">
            <strong>{verb}.</strong>{" "}
            <span className="text-zinc-700 dark:text-zinc-700">
              &ldquo;
              {pending.prompt.length > 90
                ? pending.prompt.slice(0, 90) + "…"
                : pending.prompt}
              &rdquo;
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          data-pending-action-dismiss="true"
          className="rounded-md border border-[var(--brand-strong)] bg-transparent px-3 py-1 text-xs font-medium text-[var(--brand-strong)] hover:bg-white/40"
        >
          Dismiss
        </button>
      </div>
    </aside>
  );
}

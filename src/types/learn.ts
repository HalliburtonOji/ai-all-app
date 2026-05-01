export type LearnBranch = "foundations" | "prompt-craft";

export const BRANCH_LABELS: Record<LearnBranch, string> = {
  foundations: "Foundations",
  "prompt-craft": "Prompt Craft",
};

export const BRANCH_DESCRIPTIONS: Record<LearnBranch, string> = {
  foundations:
    "A grounded mental model of what AI actually does — and doesn't.",
  "prompt-craft":
    "The shape of asks that get useful answers, and the moves that fix bad ones.",
};

export const BRANCH_ORDER: LearnBranch[] = ["foundations", "prompt-craft"];

export interface LessonMeta {
  slug: string;
  title: string;
  branch: LearnBranch;
  order: number;
  estimated_minutes: number;
  summary: string;
}

export interface Lesson extends LessonMeta {
  body: string;
}

export type LessonProgressStatus = "started" | "completed";

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_slug: string;
  status: LessonProgressStatus;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

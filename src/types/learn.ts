export type LearnBranch =
  | "foundations"
  | "prompt-craft"
  | "tool-fluency"
  | "application"
  | "career-and-money";

export const BRANCH_LABELS: Record<LearnBranch, string> = {
  foundations: "Foundations",
  "prompt-craft": "Prompt Craft",
  "tool-fluency": "Tool Fluency",
  application: "Application",
  "career-and-money": "Career & Money",
};

export const BRANCH_DESCRIPTIONS: Record<LearnBranch, string> = {
  foundations:
    "A grounded mental model of what AI actually does — and doesn't.",
  "prompt-craft":
    "The shape of asks that get useful answers, and the moves that fix bad ones.",
  "tool-fluency":
    "Picking the right tool for the job and using it well — without buying every shiny new thing.",
  application:
    "Doing real work with AI — not theoretically, in your actual life.",
  "career-and-money":
    "Earning from AI work without grift, hype, or selling courses to other course-sellers.",
};

export const BRANCH_ORDER: LearnBranch[] = [
  "foundations",
  "prompt-craft",
  "tool-fluency",
  "application",
  "career-and-money",
];

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

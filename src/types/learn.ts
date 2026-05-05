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

/**
 * One actionable chip the lesson can offer the reader so reading
 * turns into doing. Rendered as a button below the lesson body.
 *
 * For project-scoped kinds (studio_text / coach / studio_image)
 * clicking stashes the action in sessionStorage and navigates to
 * /projects, where a picker banner lets the reader pick which
 * project to drop the prefilled prompt into.
 */
export type LessonActionKind =
  | "studio_text"
  | "coach"
  | "studio_image"
  | "start_project";

export interface LessonAction {
  kind: LessonActionKind;
  label: string;
  prompt: string;
}

export interface LessonMeta {
  slug: string;
  title: string;
  branch: LearnBranch;
  order: number;
  estimated_minutes: number;
  summary: string;
  /**
   * When set, the lesson player shows an "Submit your attempt" form
   * below the lesson body. The string is fed to the coach as a
   * grading rubric: what to praise, what to flag, what good looks
   * like. Single-line in frontmatter (no multi-line YAML).
   */
  try_it_rubric: string | null;
  /**
   * Short prompt label for the exercise textarea, e.g.
   * "Paste your rewritten prompt below". Optional; defaults to a
   * generic placeholder if missing.
   */
  try_it_prompt: string | null;
  /**
   * Optional curated actions: `kind|label|prompt; kind|label|prompt`.
   * Each chip routes the reader into a project surface with the
   * prompt pre-filled. Empty array if not provided.
   */
  try_it_actions: LessonAction[];
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

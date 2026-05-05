import "server-only";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type {
  LearnBranch,
  Lesson,
  LessonAction,
  LessonActionKind,
  LessonMeta,
} from "@/types/learn";
import { BRANCH_ORDER } from "@/types/learn";

const ACTION_KINDS: ReadonlySet<LessonActionKind> = new Set([
  "studio_text",
  "coach",
  "studio_image",
  "start_project",
]);

/**
 * Parse pipe-delimited actions field. Format:
 *   kind|label|prompt; kind|label|prompt
 * Whitespace tolerant. Silently drops malformed entries so a typo in
 * one lesson doesn't break the whole catalog.
 */
function parseActions(raw: string | undefined): LessonAction[] {
  if (!raw) return [];
  return raw
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry): LessonAction | null => {
      const parts = entry.split("|").map((p) => p.trim());
      if (parts.length !== 3) return null;
      const [kindRaw, label, prompt] = parts;
      if (!ACTION_KINDS.has(kindRaw as LessonActionKind)) return null;
      if (!label || !prompt) return null;
      return {
        kind: kindRaw as LessonActionKind,
        label,
        prompt,
      };
    })
    .filter((a): a is LessonAction => a !== null);
}

/**
 * Lessons live as markdown files in `content/lessons/` at the repo
 * root. Each file has a YAML frontmatter block with the LessonMeta
 * fields. We hand-parse the frontmatter (keep deps lean) — the format
 * is small and stable.
 *
 * Loaded once per Node process and cached in module scope.
 */

const LESSONS_DIR = path.join(process.cwd(), "content", "lessons");

let cache: Lesson[] | null = null;

function parseFrontmatter(raw: string): { meta: LessonMeta; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    throw new Error("Lesson file missing frontmatter block");
  }
  const [, frontmatter, body] = match;

  const fields: Record<string, string> = {};
  for (const line of frontmatter.split(/\r?\n/)) {
    const m = line.match(/^([a-z_]+):\s*(.+)$/);
    if (!m) continue;
    fields[m[1]] = m[2].trim();
  }

  const required = [
    "slug",
    "title",
    "branch",
    "order",
    "estimated_minutes",
    "summary",
  ];
  for (const k of required) {
    if (!fields[k]) {
      throw new Error(`Lesson frontmatter missing field: ${k}`);
    }
  }

  const branch = fields.branch as LearnBranch;
  if (!BRANCH_ORDER.includes(branch)) {
    throw new Error(`Lesson has unknown branch: ${branch}`);
  }

  return {
    meta: {
      slug: fields.slug,
      title: fields.title,
      branch,
      order: Number.parseInt(fields.order, 10),
      estimated_minutes: Number.parseInt(fields.estimated_minutes, 10),
      summary: fields.summary,
      try_it_rubric: fields.try_it_rubric || null,
      try_it_prompt: fields.try_it_prompt || null,
      try_it_actions: parseActions(fields.try_it_actions),
    },
    body: body.trim(),
  };
}

function loadAll(): Lesson[] {
  if (cache) return cache;

  const files = readdirSync(LESSONS_DIR).filter((f) => f.endsWith(".md"));
  const lessons: Lesson[] = files.map((file) => {
    const raw = readFileSync(path.join(LESSONS_DIR, file), "utf8");
    const { meta, body } = parseFrontmatter(raw);
    return { ...meta, body };
  });

  // Sort by branch (master order) then by per-branch `order` field.
  lessons.sort((a, b) => {
    const branchDiff =
      BRANCH_ORDER.indexOf(a.branch) - BRANCH_ORDER.indexOf(b.branch);
    if (branchDiff !== 0) return branchDiff;
    return a.order - b.order;
  });

  cache = lessons;
  return lessons;
}

export function getAllLessons(): Lesson[] {
  return loadAll();
}

export function getLessonBySlug(slug: string): Lesson | null {
  return loadAll().find((l) => l.slug === slug) ?? null;
}

export function getLessonsByBranch(branch: LearnBranch): Lesson[] {
  return loadAll().filter((l) => l.branch === branch);
}

/**
 * The first lesson in the catalog — used by the dashboard "Suggested
 * for you" panel for users with no progress yet.
 */
export function getFirstLesson(): Lesson {
  const lessons = loadAll();
  if (lessons.length === 0) {
    throw new Error("No lessons available");
  }
  return lessons[0];
}

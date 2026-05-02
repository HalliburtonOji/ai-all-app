import type { ProjectType } from "@/types/project";

/**
 * Curated Project templates that pre-fill the create form. Each one is a
 * starting point a real user might recognise. Adding more is editing
 * this file — they're not in the DB.
 *
 * Tone match: same wholesome charter as the rest of the app. No
 * "10x your productivity" energy.
 */
export interface ProjectTemplate {
  slug: string;
  title: string;
  blurb: string;
  type: ProjectType;
  defaultName: string;
  defaultDescription: string;
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    slug: "youtube-channel",
    title: "YouTube channel",
    blurb: "Posts videos on a niche topic 1–3× per week.",
    type: "channel",
    defaultName: "My YouTube channel",
    defaultDescription:
      "Posting on a niche topic 1–3× a week. Want to grow audience and revenue without burning out.",
  },
  {
    slug: "freelance-design",
    title: "Freelance design practice",
    blurb: "Multiple clients, brand and product work.",
    type: "client",
    defaultName: "Freelance design practice",
    defaultDescription:
      "Working with multiple clients on brand and product design. Looking for higher-paying gigs and steadier flow.",
  },
  {
    slug: "freelance-writing",
    title: "Freelance writing practice",
    blurb: "Copy, content, ghostwriting, journalism.",
    type: "client",
    defaultName: "Freelance writing practice",
    defaultDescription:
      "Writing for clients across content, copy, or editorial. Want fewer-but-better gigs and a clearer point of view.",
  },
  {
    slug: "saas-product",
    title: "SaaS or indie product",
    blurb: "Building an MVP, tiny team or solo.",
    type: "product",
    defaultName: "Indie product MVP",
    defaultDescription:
      "Building an MVP for a small SaaS / tool. Solo or tiny team. Looking to ship and find the first 50 users.",
  },
  {
    slug: "newsletter",
    title: "Newsletter / writing audience",
    blurb: "Write online to build a body of work.",
    type: "channel",
    defaultName: "My newsletter",
    defaultDescription:
      "Writing online to build a body of work and an audience. Aiming for 1k engaged subscribers in 6 months.",
  },
  {
    slug: "job-search",
    title: "Job search",
    blurb: "Targeting specific roles, 3–6 month horizon.",
    type: "job_search",
    defaultName: "Job search — Q3",
    defaultDescription:
      "Actively looking. Targeting specific roles. Want to land a strong offer in 3–6 months.",
  },
  {
    slug: "exploration",
    title: "Just exploring",
    blurb: "Trying things, no specific goal yet.",
    type: "exploration",
    defaultName: "AI exploration",
    defaultDescription:
      "No specific goal yet — using this Project to try things, learn by doing, and figure out what's next.",
  },
];

export function getProjectTemplateBySlug(
  slug: string,
): ProjectTemplate | null {
  return PROJECT_TEMPLATES.find((t) => t.slug === slug) ?? null;
}

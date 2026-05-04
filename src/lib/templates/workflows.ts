import type { WorkflowChainStep } from "@/types/workflows";

/**
 * Curated starter workflow chains. Users instantiate these into
 * their own project; they're version-controlled, not in the DB.
 *
 * Tone match: the wholesome charter. Each template is a small,
 * honest recipe a real freelancer / writer / professional might
 * actually run more than once.
 */
export interface WorkflowTemplate {
  slug: string;
  title: string;
  blurb: string;
  defaultName: string;
  defaultDescription: string;
  steps: WorkflowChainStep[];
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    slug: "notes-to-thread",
    title: "Notes → tweet thread",
    blurb: "Pull the sharpest insights from raw notes, then turn each into a tweet.",
    defaultName: "Notes → tweet thread",
    defaultDescription:
      "Distil rough notes into a 4–6 tweet thread. Run on talk transcripts, meeting notes, or first-draft writing.",
    steps: [
      {
        order: 0,
        kind_hint: "general",
        prompt_template:
          "Pull the 4-6 sharpest, most non-obvious insights from these notes. Drop platitudes. One insight per line, no numbering.\n\nNotes:\n{{input}}",
      },
      {
        order: 1,
        kind_hint: "social_post",
        prompt_template:
          "Turn each insight from {{previous_output}} into one tweet. Conversational, direct, no hashtags. Return them as a numbered list (1/, 2/, ...).",
      },
    ],
  },
  {
    slug: "transcript-to-blog",
    title: "Transcript → blog draft",
    blurb: "Outline first, then write a structured blog post from a meeting / call transcript.",
    defaultName: "Transcript → blog draft",
    defaultDescription:
      "Two-step pipeline that converts a raw transcript into a structured 600-1000 word blog draft.",
    steps: [
      {
        order: 0,
        kind_hint: "general",
        prompt_template:
          "From this transcript, draft a tight outline: working title, one-line hook, 3-5 H2 section headings with 1-line beats each. Keep only the genuinely useful material.\n\nTranscript:\n{{input}}",
      },
      {
        order: 1,
        kind_hint: "long_form",
        prompt_template:
          "Write the blog post following this outline. 600-1000 words, opening hook → sections → closing line. Direct voice, no corporate filler.\n\nOutline:\n{{previous_output}}",
      },
    ],
  },
  {
    slug: "lead-to-outreach",
    title: "Lead notes → outreach email",
    blurb: "Summarise what matters about a prospect, then write a non-salesy first email.",
    defaultName: "Lead notes → outreach email",
    defaultDescription:
      "For freelancers / consultants. Turns research notes about a prospect into a short, specific first-touch email.",
    steps: [
      {
        order: 0,
        kind_hint: "general",
        prompt_template:
          "From these notes, identify: (1) the 1-2 things this person actually cares about right now, (2) one specific recent thing they said or shipped, (3) what they probably don't need yet another pitch about. Keep it terse.\n\nNotes:\n{{input}}",
      },
      {
        order: 1,
        kind_hint: "email",
        prompt_template:
          "Write a 4-6 sentence first-touch email. Open by referencing the specific recent thing. Make one concrete observation, then ask one specific question. No CTAs, no salesy language, no 'hope you're well'.\n\nContext:\n{{previous_output}}",
      },
    ],
  },
  {
    slug: "feature-to-changelog",
    title: "PR/feature notes → changelog + announcement",
    blurb: "Turn raw feature notes into a tight changelog line and a customer-facing post.",
    defaultName: "Feature → changelog + post",
    defaultDescription:
      "For indie product builders. Two outputs from one set of notes: an internal changelog line and a short customer announcement.",
    steps: [
      {
        order: 0,
        kind_hint: "general",
        prompt_template:
          "Write a single 1-2 sentence changelog line for these feature notes. Format: 'Added X — does Y.' Plain English, user-facing benefit.\n\nNotes:\n{{input}}",
      },
      {
        order: 1,
        kind_hint: "long_form",
        prompt_template:
          "Now write a 200-300 word customer announcement. Open with the user problem this solves, then how to use it, then one honest limitation. No marketing fluff.\n\nChangelog line:\n{{previous_output}}",
      },
    ],
  },
];

export function getWorkflowTemplateBySlug(
  slug: string,
): WorkflowTemplate | null {
  return WORKFLOW_TEMPLATES.find((t) => t.slug === slug) ?? null;
}

/**
 * Tool specifications passed to Anthropic's `tools` parameter so the
 * coach can use Studio tools inline during a conversation. Each spec
 * mirrors the Anthropic SDK's expected shape (`name` + `description`
 * + `input_schema`).
 *
 * Adding a tool: append the spec here, the union type below, and a
 * matching handler in `tool-handlers.ts`. The coach stream route's
 * dispatch chain picks up new tools automatically once handlers exist.
 */

import type { Tool } from "@anthropic-ai/sdk/resources/messages.mjs";

export const STUDIO_IMAGE_TOOL: Tool = {
  name: "studio_image_generate",
  description:
    "Generate a 1024x1024 image from a text prompt and save it to the current project's Studio gallery. Use this when the user asks you to draw, design, illustrate, sketch, paint, or visualize something specific. Before invoking, briefly tell the user (one sentence) what you're about to draw so they know what's coming.",
  input_schema: {
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description:
          "A vivid, concrete description of the image. 1–2 sentences. Include style cues (photorealistic, minimal line art, oil painting, isometric 3D, etc.) when the user hasn't specified.",
      },
    },
    required: ["prompt"],
  },
};

export const STUDIO_TEXT_DRAFT_TOOL: Tool = {
  name: "studio_text_draft",
  description:
    "Write a short piece of copy — an email, a social post, a caption, or general text — and save it to the current project's Studio gallery. Use when the user asks for help drafting something they want to send/publish. Before invoking, briefly tell the user what you're about to draft.",
  input_schema: {
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description:
          "A clear description of what to write — purpose, audience, tone, key points to hit. 1–3 sentences.",
      },
      kind: {
        type: "string",
        enum: ["email", "social_post", "caption", "general"],
        description:
          "What flavor of copy. 'email' for a single email reply or outreach. 'social_post' for Twitter/X/LinkedIn/Threads. 'caption' for image/video. 'general' if none of the above fit.",
      },
    },
    required: ["prompt", "kind"],
  },
};

export const STUDIO_VOICE_GENERATE_TOOL: Tool = {
  name: "studio_voice_generate",
  description:
    "Generate a voice-over audio clip (≤30 seconds) from a short script and save it to the current project's Studio gallery. Use when the user wants something read aloud or wants narration. Hard cap: 500 characters in the script. If the user's script is longer, ask them to trim it instead of invoking the tool.",
  input_schema: {
    type: "object",
    properties: {
      script: {
        type: "string",
        description:
          "The text to be spoken. ≤500 characters. Plain prose; punctuation drives intonation.",
      },
      voice_id: {
        type: "string",
        description:
          "Optional ElevenLabs voice id. Defaults to Rachel (warm US English) if omitted. Only use if the user has specified a voice preference.",
      },
    },
    required: ["script"],
  },
};

export const ALL_COACH_TOOLS: Tool[] = [
  STUDIO_IMAGE_TOOL,
  STUDIO_TEXT_DRAFT_TOOL,
  STUDIO_VOICE_GENERATE_TOOL,
];

export type CoachToolName =
  | "studio_image_generate"
  | "studio_text_draft"
  | "studio_voice_generate";

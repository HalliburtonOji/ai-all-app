/**
 * Tool specifications passed to Anthropic's `tools` parameter so the
 * coach can use Studio tools (image generation for now) inline during a
 * conversation. Each spec mirrors the Anthropic SDK's expected shape
 * (`name` + `description` + `input_schema`).
 *
 * Adding a tool: append to this file + add a handler in
 * `tool-handlers.ts` + extend the SuggestionAction union. The coach
 * stream route reads `ALL_COACH_TOOLS` to advertise tools to Claude.
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

export const ALL_COACH_TOOLS: Tool[] = [STUDIO_IMAGE_TOOL];

export type CoachToolName = "studio_image_generate";

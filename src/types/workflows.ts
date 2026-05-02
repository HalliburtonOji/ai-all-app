import type { TextDraftKind } from "@/lib/studio/generate-text";

export const MAX_CHAIN_STEPS = 5;
export const MAX_CHAIN_NAME_LEN = 100;
export const MAX_CHAIN_DESC_LEN = 500;
export const MAX_STEP_PROMPT_LEN = 2000;
export const MAX_RUN_INPUT_LEN = 8000;

/**
 * One step in a workflow chain. The prompt_template is interpolated
 * at run time with `{{input}}` (the user's raw input to the chain)
 * and `{{previous_output}}` (the prior step's content). Both
 * placeholders are optional; they're substituted only if present.
 */
export interface WorkflowChainStep {
  order: number;
  kind_hint: TextDraftKind;
  prompt_template: string;
}

export interface WorkflowChain {
  id: string;
  user_id: string;
  project_id: string;
  name: string;
  description: string | null;
  steps: WorkflowChainStep[];
  created_at: string;
  updated_at: string;
}

/**
 * One ephemeral execution of a chain. Stored only in client state;
 * we don't persist chain runs (the resulting studio_outputs are the
 * durable artifacts).
 */
export interface WorkflowRunStepResult {
  order: number;
  kind_hint: TextDraftKind;
  output_id: string | null;
  content_text: string | null;
  error: string | null;
}

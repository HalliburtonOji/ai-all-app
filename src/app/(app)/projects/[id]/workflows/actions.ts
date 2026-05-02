"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  generateTextDraftForProject,
  type TextDraftKind,
} from "@/lib/studio/generate-text";
import { getUserApiKey } from "@/lib/byok/get-key";
import { buildStudioMemoryHint } from "@/lib/coach/build-memory";
import type { ProjectFact, UserFact } from "@/types/coach";
import {
  MAX_CHAIN_NAME_LEN,
  MAX_CHAIN_DESC_LEN,
  MAX_CHAIN_STEPS,
  MAX_STEP_PROMPT_LEN,
  MAX_RUN_INPUT_LEN,
  type WorkflowChainStep,
  type WorkflowRunStepResult,
} from "@/types/workflows";

const ALLOWED_KIND_HINTS: ReadonlySet<TextDraftKind> = new Set([
  "general",
  "email",
  "social_post",
  "caption",
  "code",
  "long_form",
]);

interface ChainOwnership {
  userId: string;
  projectId: string;
}

async function loadOwnedProject(
  projectId: string,
): Promise<ChainOwnership | { error: string }> {
  if (!projectId) return { error: "Missing project id" };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: project } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project || project.user_id !== user.id) {
    return { error: "Project not found" };
  }
  return { userId: user.id, projectId };
}

function parseStepsFromForm(formData: FormData): {
  steps?: WorkflowChainStep[];
  error?: string;
} {
  const stepsRaw = (formData.get("steps") as string) ?? "[]";
  let parsed: unknown;
  try {
    parsed = JSON.parse(stepsRaw);
  } catch {
    return { error: "Steps payload was malformed" };
  }
  if (!Array.isArray(parsed)) {
    return { error: "Steps must be an array" };
  }
  if (parsed.length === 0) {
    return { error: "At least one step is required" };
  }
  if (parsed.length > MAX_CHAIN_STEPS) {
    return { error: `Maximum ${MAX_CHAIN_STEPS} steps per chain` };
  }
  const steps: WorkflowChainStep[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const s = parsed[i] as Record<string, unknown>;
    const kindHint = (s?.kind_hint as string) ?? "general";
    const promptTemplate = ((s?.prompt_template as string) ?? "").trim();
    if (!ALLOWED_KIND_HINTS.has(kindHint as TextDraftKind)) {
      return { error: `Step ${i + 1}: pick a valid kind` };
    }
    if (!promptTemplate) {
      return { error: `Step ${i + 1}: prompt template is empty` };
    }
    if (promptTemplate.length > MAX_STEP_PROMPT_LEN) {
      return {
        error: `Step ${i + 1}: prompt template too long (max ${MAX_STEP_PROMPT_LEN} chars)`,
      };
    }
    steps.push({
      order: i,
      kind_hint: kindHint as TextDraftKind,
      prompt_template: promptTemplate,
    });
  }
  return { steps };
}

export interface CreateChainResult {
  chainId?: string;
  error?: string;
}

export async function createWorkflowChain(
  formData: FormData,
): Promise<CreateChainResult> {
  const projectId = ((formData.get("project_id") as string) ?? "").trim();
  const name = ((formData.get("name") as string) ?? "").trim();
  const description = ((formData.get("description") as string) ?? "").trim();

  if (!name) return { error: "Name is required" };
  if (name.length > MAX_CHAIN_NAME_LEN) {
    return { error: `Name must be ${MAX_CHAIN_NAME_LEN} chars or fewer` };
  }
  if (description.length > MAX_CHAIN_DESC_LEN) {
    return {
      error: `Description must be ${MAX_CHAIN_DESC_LEN} chars or fewer`,
    };
  }

  const stepsResult = parseStepsFromForm(formData);
  if (stepsResult.error) return { error: stepsResult.error };

  const ctx = await loadOwnedProject(projectId);
  if ("error" in ctx) return { error: ctx.error };

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("workflow_chains")
    .insert({
      user_id: ctx.userId,
      project_id: ctx.projectId,
      name,
      description: description || null,
      steps: stepsResult.steps,
    })
    .select("id")
    .single();

  if (error || !row) {
    return { error: "Could not save chain — try again." };
  }

  revalidatePath(`/projects/${projectId}`);
  return { chainId: row.id };
}

export async function updateWorkflowChain(
  formData: FormData,
): Promise<CreateChainResult> {
  const id = ((formData.get("id") as string) ?? "").trim();
  const projectId = ((formData.get("project_id") as string) ?? "").trim();
  const name = ((formData.get("name") as string) ?? "").trim();
  const description = ((formData.get("description") as string) ?? "").trim();

  if (!id) return { error: "Missing chain id" };
  if (!name) return { error: "Name is required" };
  if (name.length > MAX_CHAIN_NAME_LEN) {
    return { error: `Name must be ${MAX_CHAIN_NAME_LEN} chars or fewer` };
  }

  const stepsResult = parseStepsFromForm(formData);
  if (stepsResult.error) return { error: stepsResult.error };

  const ctx = await loadOwnedProject(projectId);
  if ("error" in ctx) return { error: ctx.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("workflow_chains")
    .update({
      name,
      description: description || null,
      steps: stepsResult.steps,
    })
    .eq("id", id)
    .eq("user_id", ctx.userId);

  if (error) return { error: "Could not update chain — try again." };

  revalidatePath(`/projects/${projectId}`);
  return { chainId: id };
}

export async function deleteWorkflowChain(formData: FormData) {
  const id = ((formData.get("id") as string) ?? "").trim();
  const projectId = ((formData.get("project_id") as string) ?? "").trim();
  if (!id || !projectId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("workflow_chains")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath(`/projects/${projectId}`);
}

export interface RunChainResult {
  results?: WorkflowRunStepResult[];
  error?: string;
}

/**
 * Run a chain on a fresh user input. Each step is executed
 * server-side in sequence. The substituted prompt is the
 * step.prompt_template with `{{input}}` → user's input and
 * `{{previous_output}}` → prior step's content_text. Outputs are
 * stored as regular studio_outputs rows so they show up in galleries
 * + counts.
 *
 * If a step fails, we stop the chain and return the partial results
 * so the user can see what worked and retry from there.
 */
export async function runWorkflowChain(
  formData: FormData,
): Promise<RunChainResult> {
  const id = ((formData.get("id") as string) ?? "").trim();
  const projectId = ((formData.get("project_id") as string) ?? "").trim();
  const input = ((formData.get("input") as string) ?? "").trim();

  if (!id) return { error: "Missing chain id" };
  if (!projectId) return { error: "Missing project id" };
  if (!input) return { error: "Input is required" };
  if (input.length > MAX_RUN_INPUT_LEN) {
    return { error: `Input must be ${MAX_RUN_INPUT_LEN} chars or fewer` };
  }

  const ctx = await loadOwnedProject(projectId);
  if ("error" in ctx) return { error: ctx.error };

  const supabase = await createClient();
  const { data: chain } = await supabase
    .from("workflow_chains")
    .select("id, project_id, steps, user_id")
    .eq("id", id)
    .maybeSingle();
  if (!chain || chain.user_id !== ctx.userId || chain.project_id !== projectId) {
    return { error: "Chain not found" };
  }

  const steps = (chain.steps as WorkflowChainStep[]) ?? [];
  if (steps.length === 0) return { error: "Chain has no steps" };

  // Memory hint shared across all steps (no point recomputing).
  const [{ data: pfRows }, { data: ufRows }] = await Promise.all([
    supabase
      .from("project_facts")
      .select("id, fact, pinned, created_at")
      .eq("project_id", projectId)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("user_facts")
      .select("id, fact, pinned, created_at")
      .eq("user_id", ctx.userId)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10),
  ]);
  const memoryHint = buildStudioMemoryHint(
    (pfRows ?? []) as ProjectFact[],
    (ufRows ?? []) as UserFact[],
  );

  const userKey = await getUserApiKey(supabase, "anthropic");

  const results: WorkflowRunStepResult[] = [];
  let previousOutput = "";

  for (const step of steps) {
    const prompt = step.prompt_template
      .replaceAll("{{input}}", input)
      .replaceAll("{{previous_output}}", previousOutput);

    const stepResult = await generateTextDraftForProject(
      supabase,
      ctx.userId,
      projectId,
      prompt,
      step.kind_hint,
      memoryHint,
      userKey,
    );

    if (stepResult.error || !stepResult.outputId) {
      results.push({
        order: step.order,
        kind_hint: step.kind_hint,
        output_id: null,
        content_text: null,
        error: stepResult.error ?? "Step failed",
      });
      break;
    }

    results.push({
      order: step.order,
      kind_hint: step.kind_hint,
      output_id: stepResult.outputId,
      content_text: stepResult.contentText ?? null,
      error: null,
    });
    previousOutput = stepResult.contentText ?? "";
  }

  revalidatePath(`/projects/${projectId}`);
  return { results };
}

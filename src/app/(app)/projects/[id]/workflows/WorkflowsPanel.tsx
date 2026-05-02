"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createWorkflowChain,
  updateWorkflowChain,
  deleteWorkflowChain,
  runWorkflowChain,
} from "./actions";
import {
  MAX_CHAIN_STEPS,
  MAX_RUN_INPUT_LEN,
  type WorkflowChain,
  type WorkflowChainStep,
  type WorkflowRunStepResult,
} from "@/types/workflows";

type View =
  | { kind: "list" }
  | { kind: "edit"; chain: WorkflowChain | null } // null = creating new
  | { kind: "run"; chain: WorkflowChain };

const KIND_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "general", label: "General" },
  { value: "long_form", label: "Long-form (blog/article)" },
  { value: "email", label: "Email" },
  { value: "social_post", label: "Social post" },
  { value: "caption", label: "Caption" },
  { value: "code", label: "Code" },
];

export function WorkflowsPanel({
  projectId,
  chains,
}: {
  projectId: string;
  chains: WorkflowChain[];
}) {
  const [view, setView] = useState<View>({ kind: "list" });

  return (
    <section data-studio-panel="workflows" className="mt-4 space-y-6">
      <Link
        href={`/projects/${projectId}?tab=studio`}
        className="text-xs text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
      >
        ← All Studio tools
      </Link>
      <div>
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Workflows
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Save 2–5 step pipelines. Each step is a text-drafter call. Use{" "}
          <code className="rounded bg-[var(--surface-muted)] px-1 text-xs">
            {"{{input}}"}
          </code>{" "}
          for the chain&apos;s raw input and{" "}
          <code className="rounded bg-[var(--surface-muted)] px-1 text-xs">
            {"{{previous_output}}"}
          </code>{" "}
          for the previous step&apos;s output.
        </p>
      </div>

      {view.kind === "list" && (
        <ChainList
          projectId={projectId}
          chains={chains}
          onNew={() => setView({ kind: "edit", chain: null })}
          onRun={(c) => setView({ kind: "run", chain: c })}
          onEdit={(c) => setView({ kind: "edit", chain: c })}
        />
      )}
      {view.kind === "edit" && (
        <ChainEditor
          projectId={projectId}
          chain={view.chain}
          onCancel={() => setView({ kind: "list" })}
          onSaved={() => setView({ kind: "list" })}
        />
      )}
      {view.kind === "run" && (
        <ChainRunner
          projectId={projectId}
          chain={view.chain}
          onBack={() => setView({ kind: "list" })}
          onEdit={() => setView({ kind: "edit", chain: view.chain })}
        />
      )}
    </section>
  );
}

function ChainList({
  projectId,
  chains,
  onNew,
  onRun,
  onEdit,
}: {
  projectId: string;
  chains: WorkflowChain[];
  onNew: () => void;
  onRun: (c: WorkflowChain) => void;
  onEdit: (c: WorkflowChain) => void;
}) {
  return (
    <div data-workflows-list-view="true">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-black dark:text-white">
          Saved chains
        </h3>
        <button
          type="button"
          onClick={onNew}
          data-workflow-new="true"
          className="rounded-md bg-[var(--brand)] px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--brand-strong)]"
        >
          + New chain
        </button>
      </div>

      {chains.length === 0 ? (
        <p
          data-workflows-empty="true"
          className="mt-4 rounded-lg border border-dashed border-[var(--border-soft)] bg-[var(--surface)] p-6 text-sm text-zinc-600 dark:text-zinc-400"
        >
          No chains yet. Create one to save a multi-step recipe you run more
          than once.
        </p>
      ) : (
        <ul
          data-workflows-list="true"
          className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {chains.map((c) => (
            <li
              key={c.id}
              data-workflow-id={c.id}
              className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] p-4"
            >
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {c.name}
              </p>
              {c.description && (
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  {c.description}
                </p>
              )}
              <p className="mt-2 text-xs text-zinc-500">
                {c.steps.length} {c.steps.length === 1 ? "step" : "steps"}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => onRun(c)}
                  data-workflow-run-button={c.id}
                  className="rounded-md bg-[var(--brand)] px-3 py-1 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[var(--brand-strong)]"
                >
                  Run
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(c)}
                  data-workflow-edit-button={c.id}
                  className="rounded-md border border-[var(--border-soft)] bg-transparent px-3 py-1 text-xs font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)]"
                >
                  Edit
                </button>
                <DeleteChainButton chainId={c.id} projectId={projectId} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DeleteChainButton({
  chainId,
  projectId,
}: {
  chainId: string;
  projectId: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onDelete(formData: FormData) {
    startTransition(async () => {
      await deleteWorkflowChain(formData);
      router.refresh();
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        data-workflow-delete-button={chainId}
        className="rounded-md px-3 py-1 text-xs text-zinc-600 hover:bg-black/5 hover:text-red-700 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-red-400"
      >
        Delete
      </button>
    );
  }
  return (
    <form action={onDelete} className="flex items-center gap-1">
      <input type="hidden" name="id" value={chainId} />
      <input type="hidden" name="project_id" value={projectId} />
      <button
        type="submit"
        disabled={isPending}
        data-workflow-confirm-delete={chainId}
        className="rounded-md border border-red-300 bg-white px-2 py-0.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-md px-2 py-0.5 text-xs text-zinc-600 hover:bg-black/5"
      >
        No
      </button>
    </form>
  );
}

function ChainEditor({
  projectId,
  chain,
  onCancel,
  onSaved,
}: {
  projectId: string;
  chain: WorkflowChain | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!chain;
  const [name, setName] = useState(chain?.name ?? "");
  const [description, setDescription] = useState(chain?.description ?? "");
  const [steps, setSteps] = useState<WorkflowChainStep[]>(
    chain?.steps ?? [
      { order: 0, kind_hint: "general", prompt_template: "" },
    ],
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function updateStep(idx: number, patch: Partial<WorkflowChainStep>) {
    setSteps((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    );
  }

  function addStep() {
    if (steps.length >= MAX_CHAIN_STEPS) return;
    setSteps((prev) => [
      ...prev,
      { order: prev.length, kind_hint: "general", prompt_template: "" },
    ]);
  }

  function removeStep(idx: number) {
    setSteps((prev) =>
      prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i })),
    );
  }

  function onSubmit() {
    setError(null);
    const formData = new FormData();
    formData.set("project_id", projectId);
    if (chain) formData.set("id", chain.id);
    formData.set("name", name);
    formData.set("description", description);
    formData.set("steps", JSON.stringify(steps));

    startTransition(async () => {
      const result = isEdit
        ? await updateWorkflowChain(formData)
        : await createWorkflowChain(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
      onSaved();
    });
  }

  return (
    <div data-workflows-edit-view="true" className="space-y-4">
      <h3 className="text-sm font-semibold text-black dark:text-white">
        {isEdit ? "Edit chain" : "New chain"}
      </h3>

      <label className="block text-sm">
        <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Name <span className="text-red-700">*</span>
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          required
          placeholder="e.g. Notes → tweet thread"
          data-workflow-name="true"
          className="mt-1 block w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-zinc-400 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)]"
        />
      </label>

      <label className="block text-sm">
        <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Description (optional)
        </span>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          placeholder="Short note about when to use this chain."
          data-workflow-description="true"
          className="mt-1 block w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-zinc-400 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)]"
        />
      </label>

      <div data-workflow-steps-list="true" className="space-y-3">
        {steps.map((step, idx) => (
          <div
            key={idx}
            data-workflow-step-index={idx}
            className="rounded-md border border-[var(--border-soft)] bg-[var(--surface)] p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Step {idx + 1}
              </p>
              {steps.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeStep(idx)}
                  data-workflow-step-remove={idx}
                  className="rounded-md px-2 py-0.5 text-xs text-zinc-600 hover:bg-black/5 hover:text-red-700 dark:text-zinc-400"
                >
                  Remove
                </button>
              )}
            </div>
            <label className="mt-2 block text-xs">
              <span className="text-zinc-600 dark:text-zinc-400">
                Output kind
              </span>
              <select
                value={step.kind_hint}
                onChange={(e) =>
                  updateStep(idx, {
                    kind_hint: e.target
                      .value as WorkflowChainStep["kind_hint"],
                  })
                }
                data-workflow-step-kind={idx}
                className="mt-1 block w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--foreground)]"
              >
                {KIND_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-2 block text-xs">
              <span className="text-zinc-600 dark:text-zinc-400">
                Prompt template
              </span>
              <textarea
                value={step.prompt_template}
                onChange={(e) =>
                  updateStep(idx, { prompt_template: e.target.value })
                }
                rows={3}
                maxLength={2000}
                placeholder={
                  idx === 0
                    ? "Pull the 3 sharpest insights from these notes: {{input}}"
                    : "Turn each insight from {{previous_output}} into one tweet."
                }
                data-workflow-step-prompt={idx}
                className="mt-1 block w-full resize-y rounded-md border border-[var(--border-soft)] bg-[var(--surface)] px-2 py-1 font-mono text-xs text-[var(--foreground)] placeholder:text-zinc-400 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)]"
              />
            </label>
          </div>
        ))}
      </div>

      {steps.length < MAX_CHAIN_STEPS && (
        <button
          type="button"
          onClick={addStep}
          data-workflow-step-add="true"
          className="rounded-md border border-dashed border-[var(--border-soft)] bg-transparent px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)]"
        >
          + Add step ({steps.length}/{MAX_CHAIN_STEPS})
        </button>
      )}

      {error && (
        <p
          role="alert"
          data-workflow-error="true"
          className="text-sm text-red-700 dark:text-red-400"
        >
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/5"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isPending || name.trim().length === 0}
          data-workflow-save="true"
          className="rounded-md bg-[var(--brand)] px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--brand-strong)] disabled:opacity-50"
        >
          {isPending ? "Saving…" : isEdit ? "Save changes" : "Create chain"}
        </button>
      </div>
    </div>
  );
}

function ChainRunner({
  projectId,
  chain,
  onBack,
  onEdit,
}: {
  projectId: string;
  chain: WorkflowChain;
  onBack: () => void;
  onEdit: () => void;
}) {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<WorkflowRunStepResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onRun() {
    setError(null);
    setResults([]);
    const formData = new FormData();
    formData.set("id", chain.id);
    formData.set("project_id", projectId);
    formData.set("input", input);
    startTransition(async () => {
      const result = await runWorkflowChain(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setResults(result.results ?? []);
    });
  }

  return (
    <div data-workflows-run-view="true" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-black dark:text-white">
            Run: {chain.name}
          </h3>
          {chain.description && (
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              {chain.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md border border-[var(--border-soft)] bg-transparent px-3 py-1 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
          >
            Edit chain
          </button>
          <button
            type="button"
            onClick={onBack}
            className="rounded-md px-3 py-1 text-xs text-zinc-600 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/5"
          >
            ← Back to list
          </button>
        </div>
      </div>

      <label className="block text-sm">
        <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Input
        </span>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={5}
          maxLength={MAX_RUN_INPUT_LEN}
          placeholder="Paste the raw material the chain operates on."
          data-workflow-run-input="true"
          disabled={isPending}
          className="mt-1 block w-full resize-y rounded-md border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-zinc-400 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)] disabled:opacity-50"
        />
      </label>

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={onRun}
          disabled={isPending || input.trim().length === 0}
          data-workflow-run-submit="true"
          className="rounded-md bg-[var(--brand)] px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--brand-strong)] disabled:opacity-50"
        >
          {isPending ? "Running…" : "Run chain"}
        </button>
      </div>

      {error && (
        <p
          role="alert"
          data-workflow-run-error="true"
          className="text-sm text-red-700 dark:text-red-400"
        >
          {error}
        </p>
      )}

      {results.length > 0 && (
        <ol
          data-workflow-results="true"
          className="mt-2 space-y-3"
        >
          {results.map((r) => (
            <li
              key={r.order}
              data-workflow-result-order={r.order}
              className={
                "rounded-lg border p-4 " +
                (r.error
                  ? "border-red-300 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30"
                  : "border-[var(--border-soft)] bg-[var(--surface)]")
              }
            >
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Step {r.order + 1} · {r.kind_hint}
              </p>
              {r.error ? (
                <p className="mt-2 text-sm text-red-700 dark:text-red-400">
                  {r.error}
                </p>
              ) : (
                <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--foreground)]">
                  {r.content_text}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

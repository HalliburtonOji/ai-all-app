"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveWelcomeAnswers } from "./actions";

type Step = 1 | 2 | 3;

const ROLE_OPTIONS: Array<{
  value: string;
  title: string;
  blurb: string;
}> = [
  {
    value: "builder",
    title: "Builder",
    blurb:
      "I'm building a side hustle, freelance practice, product, or audience.",
  },
  {
    value: "professional",
    title: "Professional",
    blurb:
      "I'm using AI to keep doing my job well — and harder to replace.",
  },
  {
    value: "curious",
    title: "Curious",
    blurb:
      "I'm here to get genuinely good at AI. No specific outcome yet.",
  },
];

const PROJECT_TYPE_OPTIONS = [
  { value: "channel", label: "Channel (YouTube, podcast, newsletter)" },
  { value: "client", label: "Client (a freelance project)" },
  { value: "product", label: "Product (something I'm building)" },
  { value: "job_search", label: "Job search" },
  { value: "exploration", label: "Exploration (just trying things)" },
  { value: "sandbox", label: "Sandbox (scratch space)" },
];

export function WelcomeWizard() {
  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [goal, setGoal] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectType, setProjectType] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function next() {
    setError(null);
    setStep((s) => (s === 3 ? 3 : ((s + 1) as Step)));
  }
  function back() {
    setError(null);
    setStep((s) => (s === 1 ? 1 : ((s - 1) as Step)));
  }

  function submit() {
    setError(null);
    const formData = new FormData();
    formData.set("role", role);
    formData.set("bio", bio);
    formData.set("goal", goal);
    formData.set("project_name", projectName);
    formData.set("project_type", projectType);
    formData.set("project_description", projectDescription);

    startTransition(async () => {
      const result = await saveWelcomeAnswers(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      // If they made a project, drop them straight into it.
      if (result.projectId) {
        router.push(`/projects/${result.projectId}`);
      } else {
        router.push("/dashboard");
      }
    });
  }

  return (
    <div
      data-welcome-wizard="true"
      data-welcome-step={step}
      className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <StepHeader step={step} />

      {step === 1 && (
        <div className="mt-5 space-y-4" data-welcome-step-1="true">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            What brings you here? Pick whichever fits closest — you can change
            your mind any time.
          </p>
          <div className="grid grid-cols-1 gap-2">
            {ROLE_OPTIONS.map((opt) => {
              const selected = role === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  data-welcome-role={opt.value}
                  data-selected={selected}
                  aria-pressed={selected}
                  className={
                    selected
                      ? "rounded-lg border-2 border-black bg-zinc-50 p-3 text-left dark:border-white dark:bg-zinc-900"
                      : "rounded-lg border border-zinc-300 bg-white p-3 text-left transition-colors hover:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-500"
                  }
                >
                  <p className="text-sm font-semibold text-black dark:text-white">
                    {opt.title}
                  </p>
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                    {opt.blurb}
                  </p>
                </button>
              );
            })}
          </div>
          <label className="block text-sm">
            <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              One-sentence bio (optional)
            </span>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={240}
              placeholder="e.g. Lagos-based illustrator pivoting to AI-assisted concept art"
              data-welcome-bio="true"
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black placeholder:text-zinc-400 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
            />
          </label>
        </div>
      )}

      {step === 2 && (
        <div className="mt-5 space-y-4" data-welcome-step-2="true">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            What are you actually trying to do with AI right now? The more
            concrete, the better the coach can help. Skip if you don&apos;t
            know yet.
          </p>
          <label className="block text-sm">
            <span className="sr-only">Your goal</span>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={5}
              maxLength={500}
              placeholder="e.g. I want to start charging $400/video for AI-assisted YouTube edits within 3 months."
              data-welcome-goal="true"
              className="block w-full resize-none rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black placeholder:text-zinc-400 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
            />
          </label>
        </div>
      )}

      {step === 3 && (
        <div className="mt-5 space-y-4" data-welcome-step-3="true">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Want to start a Project now? Anything you do in the app attaches to
            a Project. You can also skip this and create one later.
          </p>
          <label className="block text-sm">
            <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Project name
            </span>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              maxLength={100}
              placeholder="e.g. Travel YouTube channel"
              data-welcome-project-name="true"
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black placeholder:text-zinc-400 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
            />
          </label>
          <label className="block text-sm">
            <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Project type
            </span>
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              data-welcome-project-type="true"
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
            >
              <option value="">— pick one —</option>
              {PROJECT_TYPE_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Description (optional)
            </span>
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="One sentence on what this project is."
              data-welcome-project-description="true"
              className="mt-1 block w-full resize-none rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black placeholder:text-zinc-400 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
            />
          </label>
        </div>
      )}

      {error && (
        <p
          role="alert"
          data-welcome-error="true"
          className="mt-4 text-sm text-red-700 dark:text-red-400"
        >
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {step > 1 && (
            <button
              type="button"
              onClick={back}
              disabled={isPending}
              data-welcome-back="true"
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-black transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
            >
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              onClick={next}
              disabled={isPending}
              data-welcome-next="true"
              className="rounded-md bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={isPending}
              data-welcome-submit="true"
              className="rounded-md bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {isPending ? "Saving…" : "Finish"}
            </button>
          )}
        </div>

        <Link
          href="/dashboard"
          data-welcome-skip="true"
          className="text-xs text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          Skip for now
        </Link>
      </div>
    </div>
  );
}

function StepHeader({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-2">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Step {step} of 3
      </p>
      <div className="flex-1" />
      <ol className="flex gap-1" aria-hidden>
        {[1, 2, 3].map((s) => (
          <li
            key={s}
            className={
              s <= step
                ? "h-1.5 w-6 rounded-full bg-black dark:bg-white"
                : "h-1.5 w-6 rounded-full bg-zinc-200 dark:bg-zinc-800"
            }
          />
        ))}
      </ol>
    </div>
  );
}

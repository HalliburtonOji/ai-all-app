import Link from "next/link";
import { createProject } from "../actions";
import { PROJECT_TYPES, PROJECT_TYPE_LABELS } from "@/types/project";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
      <Link
        href="/projects"
        className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
      >
        ← Back to projects
      </Link>

      <h1 className="mt-4 text-3xl font-bold tracking-tight text-black sm:text-4xl dark:text-white">
        New project
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Create a container for your work.
      </p>

      {error && (
        <p className="mt-6 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}

      <form action={createProject} className="mt-8 space-y-5">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-black dark:text-white"
          >
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={100}
            placeholder="e.g. My TikTok cooking channel"
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-white"
          />
          <p className="mt-1 text-xs text-zinc-500">Up to 100 characters.</p>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-black dark:text-white"
          >
            Description{" "}
            <span className="text-zinc-500">(optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="A short note about what this project is for"
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-white"
          />
        </div>

        <div>
          <label
            htmlFor="project_type"
            className="block text-sm font-medium text-black dark:text-white"
          >
            Type <span className="text-red-500">*</span>
          </label>
          <select
            id="project_type"
            name="project_type"
            required
            defaultValue=""
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-white"
          >
            <option value="" disabled>
              Choose a type…
            </option>
            {PROJECT_TYPES.map((type) => (
              <option key={type} value={type}>
                {PROJECT_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="rounded-md bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Create project
          </button>
          <Link
            href="/projects"
            className="text-sm font-medium text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}

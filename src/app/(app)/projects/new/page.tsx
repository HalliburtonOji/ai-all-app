import Link from "next/link";
import { createProject } from "../actions";
import { PROJECT_TYPES, PROJECT_TYPE_LABELS } from "@/types/project";
import {
  PROJECT_TEMPLATES,
  getProjectTemplateBySlug,
} from "@/lib/templates/projects";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; template?: string }>;
}) {
  const { error, template: templateSlug } = await searchParams;
  const tpl = templateSlug ? getProjectTemplateBySlug(templateSlug) : null;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href="/projects"
        className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
      >
        ← Back to projects
      </Link>

      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--brand-strong)] shadow-sm">
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--coach-accent)]"
        />
        New project
      </div>
      <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight text-[var(--foreground)] sm:text-5xl">
        Start a new container.
      </h1>
      <p className="mt-4 max-w-xl text-base text-zinc-700 dark:text-zinc-300">
        Pick a template or fill in the form yourself. The coach attaches to
        every Project, so this is where the system gets its hooks.
      </p>

      {!tpl && (
        <section
          data-project-templates="true"
          className="mt-10 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] p-6"
        >
          <h2 className="text-sm font-semibold text-black dark:text-white">
            Start from a template
          </h2>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            Pre-fills the form below. You can edit anything before creating.
          </p>
          <ul
            data-project-templates-list="true"
            className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2"
          >
            {PROJECT_TEMPLATES.map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/projects/new?template=${t.slug}`}
                  data-project-template-slug={t.slug}
                  className="block rounded-md border border-zinc-200 bg-white p-3 text-left transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
                >
                  <p className="text-sm font-semibold text-black dark:text-white">
                    {t.title}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                    {t.blurb}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tpl && (
        <p
          data-project-template-applied={tpl.slug}
          className="mt-6 rounded-md border border-zinc-200 bg-white p-3 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
        >
          Pre-filled from <strong>{tpl.title}</strong>.{" "}
          <Link
            href="/projects/new"
            className="underline underline-offset-2"
          >
            Clear template
          </Link>
        </p>
      )}

      {error && (
        <p className="mt-6 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}

      <form
        key={tpl?.slug ?? "blank"}
        action={createProject}
        className="mt-6 space-y-5"
      >
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
            defaultValue={tpl?.defaultName ?? ""}
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
            defaultValue={tpl?.defaultDescription ?? ""}
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
            defaultValue={tpl?.type ?? ""}
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

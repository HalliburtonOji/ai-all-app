import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { ProjectCard } from "@/components/ProjectCard";
import type { Project } from "@/types/project";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  const list: Project[] = projects ?? [];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl dark:text-white">
          Projects
        </h1>
        <Link
          href="/projects/new"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          + New Project
        </Link>
      </div>

      {error && (
        <p className="mt-6 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          Failed to load projects: {error.message}
        </p>
      )}

      {list.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-lg border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-black dark:text-white">
            No projects yet
          </h2>
          <p className="mt-2 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
            A project is a container for your work — a TikTok channel, a
            freelance client, a product you&apos;re building, or just a
            sandbox to explore.
          </p>
          <Link
            href="/projects/new"
            className="mt-6 rounded-md bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Create your first project
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </main>
  );
}

import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { ProjectCard } from "@/components/ProjectCard";
import type { Project } from "@/types/project";
import { PendingActionBanner } from "./PendingActionBanner";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  const list: Project[] = projects ?? [];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--brand-strong)] shadow-sm">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--coach-accent)]"
            />
            Projects
          </div>
          <h1 className="mt-4 text-4xl font-semibold leading-[0.95] tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
            Your projects.
          </h1>
          <p className="mt-4 max-w-xl text-base text-zinc-700 dark:text-zinc-300">
            A Project is a container — channel, freelance practice, product, job
            hunt. Studio outputs, lessons, conversations, earnings all attach.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="rounded-md bg-[var(--brand)] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[var(--brand-strong)] hover:shadow-md"
        >
          + New Project
        </Link>
      </div>

      <PendingActionBanner projectIds={list.map((p) => p.id)} />

      {error && (
        <p className="mt-6 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          Failed to load projects: {error.message}
        </p>
      )}

      {list.length === 0 ? (
        <div className="mt-12 flex flex-col items-center rounded-2xl border border-dashed border-[var(--border-soft)] bg-[var(--surface)] p-12 text-center">
          <div className="relative mb-6 aspect-[4/3] w-full max-w-xs overflow-hidden rounded-xl bg-zinc-50 dark:bg-zinc-100">
            <Image
              src="/empty-states/projects.png"
              alt=""
              fill
              sizes="(max-width: 768px) 80vw, 320px"
              loading="lazy"
              decoding="async"
              className="object-cover"
            />
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
            No projects yet
          </h2>
          <p className="mt-2 max-w-sm text-sm text-zinc-700 dark:text-zinc-300">
            A Project is the container that gives the coach somewhere to think
            with you. Pick a template or start from scratch.
          </p>
          <Link
            href="/projects/new"
            className="mt-6 rounded-md bg-[var(--brand)] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[var(--brand-strong)] hover:shadow-md"
          >
            Create your first project
          </Link>
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </main>
  );
}

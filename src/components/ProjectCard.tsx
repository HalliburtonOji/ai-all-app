import Link from "next/link";
import { formatDate, type Project } from "@/types/project";
import { ProjectTypeBadge } from "./ProjectTypeBadge";

export function ProjectCard({ project }: { project: Project }) {
  const isArchived = project.status === "archived";

  return (
    <Link
      href={`/projects/${project.id}`}
      data-project-card={project.id}
      className={`bento-tile group flex flex-col rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-5 ${
        isArchived ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 text-lg font-semibold text-black dark:text-white">
          {project.name}
        </h3>
        <ProjectTypeBadge type={project.project_type} />
      </div>
      {project.description && (
        <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
          {project.description}
        </p>
      )}
      <p className="mt-4 text-xs text-zinc-500">
        {isArchived ? "Archived · " : ""}Updated {formatDate(project.updated_at)}
      </p>
    </Link>
  );
}

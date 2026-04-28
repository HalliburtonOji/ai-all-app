import { PROJECT_TYPE_LABELS, type Project } from "@/types/project";

export function buildProjectContext(project: Project): string {
  const description =
    project.description && project.description.trim().length > 0
      ? project.description
      : "(no description provided)";

  return `Project context for this conversation:
- Name: ${project.name}
- Type: ${PROJECT_TYPE_LABELS[project.project_type]}
- Description: ${description}`;
}

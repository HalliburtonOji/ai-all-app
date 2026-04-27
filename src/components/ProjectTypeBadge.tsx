import {
  PROJECT_TYPE_BADGE_CLASSES,
  PROJECT_TYPE_LABELS,
  type ProjectType,
} from "@/types/project";

export function ProjectTypeBadge({ type }: { type: ProjectType }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${PROJECT_TYPE_BADGE_CLASSES[type]}`}
    >
      {PROJECT_TYPE_LABELS[type]}
    </span>
  );
}

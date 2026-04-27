export type ProjectType =
  | "channel"
  | "client"
  | "product"
  | "job_search"
  | "exploration"
  | "sandbox";

export type ProjectStatus = "active" | "archived";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  project_type: ProjectType;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export const PROJECT_TYPES: readonly ProjectType[] = [
  "channel",
  "client",
  "product",
  "job_search",
  "exploration",
  "sandbox",
] as const;

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  channel: "Side Hustle Channel",
  client: "Client Work",
  product: "Product/Service",
  job_search: "Job Search",
  exploration: "Just Exploring",
  sandbox: "Sandbox/Test",
};

export const PROJECT_TYPE_BADGE_CLASSES: Record<ProjectType, string> = {
  channel:
    "bg-pink-500/10 text-pink-700 ring-1 ring-inset ring-pink-500/30 dark:text-pink-300",
  client:
    "bg-blue-500/10 text-blue-700 ring-1 ring-inset ring-blue-500/30 dark:text-blue-300",
  product:
    "bg-purple-500/10 text-purple-700 ring-1 ring-inset ring-purple-500/30 dark:text-purple-300",
  job_search:
    "bg-amber-500/10 text-amber-700 ring-1 ring-inset ring-amber-500/30 dark:text-amber-300",
  exploration:
    "bg-emerald-500/10 text-emerald-700 ring-1 ring-inset ring-emerald-500/30 dark:text-emerald-300",
  sandbox:
    "bg-zinc-500/10 text-zinc-700 ring-1 ring-inset ring-zinc-500/30 dark:text-zinc-300",
};

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

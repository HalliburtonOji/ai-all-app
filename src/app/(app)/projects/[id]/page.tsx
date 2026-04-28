import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { ProjectTypeBadge } from "@/components/ProjectTypeBadge";
import { formatDate, type Project } from "@/types/project";
import type { Message } from "@/types/coach";
import { toggleArchiveProject } from "../actions";
import { EditableField } from "./EditableField";
import { DeleteProjectButton } from "./DeleteProjectButton";
import { Coach } from "./Coach";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const project = data as Project;
  const isArchived = project.status === "archived";

  // Auth — middleware already redirected logged-out users, but we need
  // user.id below for the conversation lookup.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Find or create the project's coach conversation. Spec is one
  // conversation per project for now.
  let conversationId: string | null = null;
  if (user) {
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("project_id", project.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existing) {
      conversationId = existing.id;
    } else {
      const { data: created } = await supabase
        .from("conversations")
        .insert({ project_id: project.id, user_id: user.id })
        .select("id")
        .single();
      conversationId = created?.id ?? null;
    }
  }

  // Load message history for the conversation
  let initialMessages: Message[] = [];
  if (conversationId) {
    const { data: messageRows } = await supabase
      .from("messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    initialMessages = (messageRows ?? []) as Message[];
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/projects"
        className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
      >
        ← Back to projects
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <ProjectTypeBadge type={project.project_type} />
        {isArchived && (
          <span className="rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            Archived
          </span>
        )}
      </div>

      <div className="mt-3">
        <EditableField
          projectId={project.id}
          field="name"
          initialValue={project.name}
          maxLength={100}
          displayClassName="block w-full px-2 -mx-2 py-1 text-3xl sm:text-4xl font-bold tracking-tight text-black dark:text-white"
          inputClassName="text-2xl sm:text-3xl font-bold tracking-tight"
        />
      </div>

      <div className="mt-4">
        <EditableField
          projectId={project.id}
          field="description"
          initialValue={project.description ?? ""}
          multiline
          emptyText="Click to add a description…"
          displayClassName="block w-full px-2 -mx-2 py-1 text-base text-zinc-700 dark:text-zinc-300 leading-7"
        />
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-3 rounded-lg border border-zinc-200 bg-white p-4 text-sm sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Created on
          </dt>
          <dd className="mt-0.5 text-black dark:text-white">
            {formatDate(project.created_at)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Last updated
          </dt>
          <dd className="mt-0.5 text-black dark:text-white">
            {formatDate(project.updated_at)}
          </dd>
        </div>
      </dl>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-black dark:text-white">
          Coach
        </h2>
        {conversationId ? (
          <Coach
            conversationId={conversationId}
            initialMessages={initialMessages}
          />
        ) : (
          <p className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950">
            Coach is unavailable — try refreshing the page.
          </p>
        )}
      </div>

      <div className="mt-10 flex flex-wrap items-start gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <form action={toggleArchiveProject}>
          <input type="hidden" name="id" value={project.id} />
          <input type="hidden" name="current_status" value={project.status} />
          <button
            type="submit"
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
          >
            {isArchived ? "Unarchive" : "Archive"}
          </button>
        </form>
        <DeleteProjectButton projectId={project.id} />
      </div>
    </main>
  );
}

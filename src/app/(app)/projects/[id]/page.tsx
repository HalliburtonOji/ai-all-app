import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { ProjectTypeBadge } from "@/components/ProjectTypeBadge";
import { formatDate, type Project } from "@/types/project";
import type { Message, ProjectFact } from "@/types/coach";
import { toggleArchiveProject } from "../actions";
import { EditableField } from "./EditableField";
import { DeleteProjectButton } from "./DeleteProjectButton";
import { Coach } from "./Coach";
import {
  ConversationList,
  type ConversationListItem,
} from "./ConversationList";
import { ProjectTabs, type ProjectTab } from "./ProjectTabs";
import { Memory } from "./Memory";
import { Studio } from "./Studio";
import { DocumentsPanel } from "./documents/DocumentsPanel";
import { RecentActivityStrip } from "@/components/RecentActivityStrip";
import type { StudioOutput } from "@/types/studio";
import type { ProjectDocument } from "@/types/documents";

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    conversation?: string;
    tab?: string;
    prefill?: string;
    studio?: string;
  }>;
}) {
  const { id } = await params;
  const {
    conversation: requestedConversationId,
    tab: requestedTab,
    prefill: requestedPrefill,
    studio: requestedStudio,
  } = await searchParams;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const project = data as Project & {
    project_facts_last_extracted_at: string | null;
  };
  const isArchived = project.status === "archived";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Load conversations (always — sidebar shows on both tabs)
  const { data: conversationRows } = await supabase
    .from("conversations")
    .select("id, title, updated_at")
    .eq("project_id", project.id)
    .order("updated_at", { ascending: false });

  let conversations: ConversationListItem[] =
    (conversationRows ?? []) as ConversationListItem[];

  // Determine current conversation (same logic as before)
  let currentConversationId: string | null = null;
  if (
    requestedConversationId &&
    conversations.some((c) => c.id === requestedConversationId)
  ) {
    currentConversationId = requestedConversationId;
  } else if (conversations.length > 0) {
    currentConversationId = conversations[0].id;
  } else if (user) {
    const { data: newConversation } = await supabase
      .from("conversations")
      .insert({ project_id: project.id, user_id: user.id })
      .select("id, title, updated_at")
      .single();
    if (newConversation) {
      currentConversationId = newConversation.id;
      conversations = [newConversation as ConversationListItem];
    }
  }

  // Load messages for the current conversation (Coach tab needs these).
  // Fetch tool_call + studio_output_id so tool-using turns render correctly,
  // and hydrate the linked studio_output row (incl. fresh signed URL for
  // image/audio outputs) on each tool-result message.
  let initialMessages: Message[] = [];
  if (currentConversationId) {
    const { data: messageRows } = await supabase
      .from("messages")
      .select(
        "id, role, content, partial, tool_call, studio_output_id, created_at",
      )
      .eq("conversation_id", currentConversationId)
      .order("created_at", { ascending: true });

    const rows = (messageRows ?? []) as Message[];

    initialMessages = await Promise.all(
      rows.map(async (m) => {
        if (!m.studio_output_id) return m;
        const { data: outRow } = await supabase
          .from("studio_outputs")
          .select("id, kind, prompt, content_text, storage_path")
          .eq("id", m.studio_output_id)
          .maybeSingle();
        if (!outRow) return m;
        let signedUrl: string | null = null;
        if (outRow.storage_path) {
          const { data: signed } = await supabase.storage
            .from("studio-images")
            .createSignedUrl(outRow.storage_path, 60 * 60);
          signedUrl = signed?.signedUrl ?? null;
        }
        return {
          ...m,
          studio_output: {
            id: outRow.id,
            kind: outRow.kind as "image" | "text" | "audio",
            prompt: outRow.prompt,
            content_text: outRow.content_text ?? null,
            signed_url: signedUrl,
          },
        };
      }),
    );
  }

  // Load project facts (always — used for tab badge + Memory tab)
  const { data: factRows } = await supabase
    .from("project_facts")
    .select(
      "id, fact, source_thread_id, pinned, created_at, updated_at",
    )
    .eq("project_id", project.id)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  const facts: ProjectFact[] = (factRows ?? []) as ProjectFact[];
  const hasExtractedYet = project.project_facts_last_extracted_at !== null;
  // Admin button shows for the configured admin user OR any user when
  // E2E_TEST_MODE is on (so tests can drive extraction). Production never
  // sets E2E_TEST_MODE, so real users never see it.
  const isAdmin =
    !!user &&
    ((!!process.env.ADMIN_USER_ID && user.id === process.env.ADMIN_USER_ID) ||
      process.env.E2E_TEST_MODE === "true");

  // Determine current tab
  const currentTab: ProjectTab =
    requestedTab === "memory"
      ? "memory"
      : requestedTab === "studio"
        ? "studio"
        : requestedTab === "docs"
          ? "docs"
          : "coach";

  // Load all Studio outputs for this project (used for tab badge,
  // recent-activity strip, and the per-tool galleries). Hydrate signed
  // URLs only for binary outputs (image/audio); text outputs need none.
  const { data: outputRows } = await supabase
    .from("studio_outputs")
    .select(
      "id, project_id, kind, prompt, content_text, storage_path, model, metadata, is_public, created_at",
    )
    .eq("project_id", project.id)
    .order("created_at", { ascending: false })
    .limit(150);

  const studioOutputs: StudioOutput[] = await Promise.all(
    ((outputRows ?? []) as Array<Omit<StudioOutput, "signed_url">>).map(
      async (row) => {
        if (!row.storage_path) {
          return { ...row, signed_url: null };
        }
        const { data: signed } = await supabase.storage
          .from("studio-images")
          .createSignedUrl(row.storage_path, 60 * 60);
        return { ...row, signed_url: signed?.signedUrl ?? null };
      },
    ),
  );

  // Load uploaded documents (used for tab badge + the Docs panel).
  // Hydrate signed URLs for the "Open original" link.
  const { data: docRows } = await supabase
    .from("project_documents")
    .select(
      "id, user_id, project_id, filename, storage_path, size_bytes, page_count, created_at",
    )
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  const projectDocuments: ProjectDocument[] = await Promise.all(
    ((docRows ?? []) as Array<Omit<ProjectDocument, "signed_url">>).map(
      async (row) => {
        const { data: signed } = await supabase.storage
          .from("project-documents")
          .createSignedUrl(row.storage_path, 60 * 60);
        return { ...row, signed_url: signed?.signedUrl ?? null };
      },
    ),
  );

  // Build the recent-activity strip's conversation pointer: pull the most
  // recent assistant message across this project's conversations and use
  // its content as a one-line preview.
  let recentConversation: {
    id: string;
    title: string | null;
    preview: string | null;
    updated_at: string;
  } | null = null;
  if (conversations.length > 0) {
    const topConv = conversations[0];
    const { data: lastMsg } = await supabase
      .from("messages")
      .select("content, role")
      .eq("conversation_id", topConv.id)
      .eq("role", "assistant")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const previewRaw = (lastMsg?.content ?? "").trim();
    recentConversation = {
      id: topConv.id,
      title: topConv.title ?? null,
      preview: previewRaw
        ? previewRaw.length > 80
          ? previewRaw.slice(0, 79).trimEnd() + "…"
          : previewRaw
        : null,
      updated_at: topConv.updated_at,
    };
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
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

      <RecentActivityStrip
        projectId={project.id}
        recentOutputs={studioOutputs.slice(0, 3)}
        recentConversation={recentConversation}
      />

      <section className="mt-8">
        <ProjectTabs
          projectId={project.id}
          currentTab={currentTab}
          factCount={facts.length}
          outputCount={studioOutputs.length}
          documentCount={projectDocuments.length}
          currentConversationId={currentConversationId}
        />

        <div className="mt-4">
          {currentTab === "coach" ? (
            <div className="flex flex-col gap-4 md:flex-row">
              <ConversationList
                projectId={project.id}
                conversations={conversations}
                currentConversationId={currentConversationId}
              />

              <div className="min-w-0 flex-1">
                {currentConversationId ? (
                  <Coach
                    key={currentConversationId}
                    conversationId={currentConversationId}
                    projectId={project.id}
                    initialMessages={initialMessages}
                    prefill={requestedPrefill ?? null}
                  />
                ) : (
                  <p className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950">
                    Coach is unavailable — try refreshing the page.
                  </p>
                )}
              </div>
            </div>
          ) : currentTab === "memory" ? (
            <Memory
              projectId={project.id}
              facts={facts}
              hasExtractedYet={hasExtractedYet}
              isAdmin={isAdmin}
            />
          ) : currentTab === "docs" ? (
            <DocumentsPanel
              projectId={project.id}
              documents={projectDocuments}
            />
          ) : (
            <Studio
              projectId={project.id}
              outputs={studioOutputs}
              activeTool={
                requestedStudio === "text"
                  ? "text"
                  : requestedStudio === "voice"
                    ? "voice"
                    : requestedStudio === "image"
                      ? "image"
                      : null
              }
              prefill={requestedPrefill ?? null}
            />
          )}
        </div>
      </section>

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

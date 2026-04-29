import { createConversation } from "./conversation-actions";
import { ConversationItem } from "./ConversationItem";

export interface ConversationListItem {
  id: string;
  title: string;
  updated_at: string;
}

interface ConversationListProps {
  projectId: string;
  conversations: ConversationListItem[];
  currentConversationId: string | null;
}

export function ConversationList({
  projectId,
  conversations,
  currentConversationId,
}: ConversationListProps) {
  return (
    <aside className="w-full md:w-64 md:shrink-0">
      {/*
        Single rendered tree to keep tests deterministic. The <details
        open> wrapper is collapsible on mobile (the summary is the
        click-to-toggle handle); on md+ the summary is hidden and the
        details element stays visible because of the `open` attribute.
      */}
      <details
        open
        className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
      >
        <summary className="flex cursor-pointer items-center justify-between border-b border-zinc-200 px-3 py-2 text-sm font-medium text-black md:hidden dark:border-zinc-800 dark:text-white">
          <span>
            Conversations{" "}
            <span className="text-zinc-500">({conversations.length})</span>
          </span>
          <span aria-hidden className="text-zinc-400">
            ▾
          </span>
        </summary>

        <div className="flex flex-col">
          <form action={createConversation} className="p-2">
            <input type="hidden" name="project_id" value={projectId} />
            <button
              type="submit"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-left text-sm font-medium text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
            >
              + New conversation
            </button>
          </form>

          <ul className="max-h-[40vh] space-y-0.5 overflow-y-auto px-2 pb-2 md:max-h-[60vh]">
            {conversations.length === 0 ? (
              <li className="px-2 py-3 text-xs text-zinc-500">
                No conversations yet.
              </li>
            ) : (
              conversations.map((c) => (
                <ConversationItem
                  key={c.id}
                  conversation={c}
                  projectId={projectId}
                  isCurrent={c.id === currentConversationId}
                />
              ))
            )}
          </ul>
        </div>
      </details>
    </aside>
  );
}

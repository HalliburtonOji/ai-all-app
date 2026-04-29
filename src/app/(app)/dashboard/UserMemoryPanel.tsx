import type { UserFact } from "@/types/coach";
import { UserFactItem } from "./UserFactItem";
import { AdminExtractUserFactsButton } from "./AdminExtractUserFactsButton";

interface UserMemoryPanelProps {
  facts: UserFact[];
  hasExtractedYet: boolean;
  isAdmin: boolean;
}

export function UserMemoryPanel({
  facts,
  hasExtractedYet,
  isAdmin,
}: UserMemoryPanelProps) {
  return (
    <section
      data-user-memory-panel="true"
      className="mt-8"
    >
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-black dark:text-white">
            About you
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            What the coach knows about you across all your projects.
          </p>
        </div>
        {facts.length > 0 && (
          <span className="rounded-full bg-zinc-200/70 px-2 py-0.5 text-[10px] font-normal text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            Remembering {facts.length} {facts.length === 1 ? "thing" : "things"}
          </span>
        )}
      </div>

      {isAdmin && <AdminExtractUserFactsButton />}

      {facts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-center dark:border-zinc-700 dark:bg-zinc-950">
          <p className="mx-auto max-w-md text-sm text-zinc-600 dark:text-zinc-400">
            {hasExtractedYet
              ? "Nothing about you that's worth remembering yet across projects. Keep chatting in your projects — the coach will pick up cross-cutting patterns over time."
              : "The coach learns about you as you talk across all your projects. Profile-level facts (location, working style, preferences) will appear here automatically — usually overnight."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {facts.map((fact) => (
            <UserFactItem key={fact.id} fact={fact} />
          ))}
        </ul>
      )}
    </section>
  );
}

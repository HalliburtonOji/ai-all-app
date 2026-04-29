import type { ProjectFact } from "@/types/coach";
import { FactItem } from "./FactItem";
import { AdminExtractButton } from "./AdminExtractButton";

interface MemoryProps {
  projectId: string;
  facts: ProjectFact[];
  hasExtractedYet: boolean;
  isAdmin: boolean;
}

export function Memory({
  projectId,
  facts,
  hasExtractedYet,
  isAdmin,
}: MemoryProps) {
  return (
    <div>
      {isAdmin && <AdminExtractButton projectId={projectId} />}

      {facts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-950">
          <p className="mx-auto max-w-md text-sm text-zinc-600 dark:text-zinc-400">
            {hasExtractedYet
              ? "Nothing specific worth remembering yet. Keep chatting — the coach will pick up patterns as you go."
              : "The coach learns about this project as you talk. Facts will appear here automatically — usually overnight. You can edit, pin, or delete any of them."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {facts.map((fact) => (
            <FactItem key={fact.id} fact={fact} projectId={projectId} />
          ))}
        </ul>
      )}
    </div>
  );
}

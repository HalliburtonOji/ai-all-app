import type { StudioOutput } from "@/types/studio";
import type { WorkflowChain, WorkflowRun } from "@/types/workflows";
import { StudioToolGrid } from "./StudioToolGrid";
import { StudioImagePanel } from "./StudioImagePanel";
import { StudioTextPanel } from "./StudioTextPanel";
import { StudioVoicePanel } from "./StudioVoicePanel";
import { StudioEmailPanel } from "./StudioEmailPanel";
import { WorkflowsPanel } from "./workflows/WorkflowsPanel";

export type StudioActiveTool =
  | "image"
  | "text"
  | "voice"
  | "email-reply"
  | "workflows";

interface StudioProps {
  projectId: string;
  outputs: StudioOutput[];
  workflowChains: WorkflowChain[];
  workflowRuns: WorkflowRun[];
  activeTool: StudioActiveTool | null;
  prefill?: string | null;
}

/**
 * Top-level Studio panel. Routes between the tool-grid landing (when
 * no `?studio=…` param) and per-tool views. Each tool panel is its
 * own component with its own form + gallery.
 */
export function Studio({
  projectId,
  outputs,
  workflowChains,
  workflowRuns,
  activeTool,
  prefill,
}: StudioProps) {
  const counts = {
    image: outputs.filter((o) => o.kind === "image").length,
    text: outputs.filter((o) => o.kind === "text").length,
    voice: outputs.filter((o) => o.kind === "audio").length,
  };

  if (activeTool === "image") {
    return (
      <StudioImagePanel
        projectId={projectId}
        outputs={outputs.filter((o) => o.kind === "image")}
        prefill={prefill ?? null}
      />
    );
  }
  if (activeTool === "text") {
    return (
      <StudioTextPanel
        projectId={projectId}
        outputs={outputs.filter((o) => o.kind === "text")}
        prefill={prefill ?? null}
      />
    );
  }
  if (activeTool === "voice") {
    return (
      <StudioVoicePanel
        projectId={projectId}
        outputs={outputs.filter((o) => o.kind === "audio")}
        prefill={prefill ?? null}
      />
    );
  }
  if (activeTool === "email-reply") {
    return (
      <StudioEmailPanel
        projectId={projectId}
        outputs={outputs.filter((o) => o.kind === "text")}
      />
    );
  }
  if (activeTool === "workflows") {
    return (
      <WorkflowsPanel
        projectId={projectId}
        chains={workflowChains}
        runs={workflowRuns}
      />
    );
  }

  return <StudioToolGrid projectId={projectId} counts={counts} />;
}

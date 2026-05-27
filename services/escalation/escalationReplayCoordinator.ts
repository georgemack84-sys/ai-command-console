import type { EscalationError, EscalationLineageLedger, EscalationReplayGraph, EscalationStateTimeline } from "@/types/escalation";
import { buildEscalationReplayGraph } from "@/services/replay/escalationReplayGraph";
import { reconstructEscalationState } from "@/services/replay/escalationStateReconstructor";

export function coordinateEscalationReplay(input: {
  coordinationId: string;
  freshnessHash: string;
  lifecycleHash: string;
  correlationHash: string;
  coordinationHash: string;
  readinessHash: string;
  createdAt: string;
  lineage?: EscalationLineageLedger;
}): Readonly<{
  replayGraph: EscalationReplayGraph;
  timeline?: EscalationStateTimeline;
  errors: readonly EscalationError[];
}> {
  const replayGraph = buildEscalationReplayGraph(input);
  if (!input.lineage) {
    return Object.freeze({
      replayGraph,
      timeline: undefined,
      errors: Object.freeze([]),
    });
  }
  const reconstruction = reconstructEscalationState({
    coordinationId: input.coordinationId,
    lineage: input.lineage,
    replayGraph,
  });
  return Object.freeze({
    replayGraph,
    timeline: reconstruction.timeline,
    errors: reconstruction.errors,
  });
}

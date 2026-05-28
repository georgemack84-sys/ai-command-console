import type { EscalationError, EscalationLineageLedger, EscalationReplayGraph, EscalationStateTimeline } from "@/types/escalation";
import { buildEscalationTimeline } from "./escalationTimelineBuilder";
import { createEscalationError } from "@/services/escalation/escalationBoundaryEnforcer";

export function reconstructEscalationState(input: {
  coordinationId: string;
  lineage: EscalationLineageLedger;
  replayGraph: EscalationReplayGraph;
}): Readonly<{
  timeline: EscalationStateTimeline;
  errors: readonly EscalationError[];
}> {
  const errors: EscalationError[] = [];
  if (input.lineage.entries.length === 0) {
    errors.push(createEscalationError(
      "ESCALATION_LINEAGE_MISSING",
      "Escalation replay reconstruction requires immutable lineage.",
      "lineage",
    ));
  }
  if (!input.replayGraph.replaySafe) {
    errors.push(createEscalationError(
      "ESCALATION_REPLAY_AMBIGUITY",
      "Escalation replay graph is not replay-safe.",
      "replayGraph",
    ));
  }
  return Object.freeze({
    timeline: buildEscalationTimeline({
      coordinationId: input.coordinationId,
      lineage: input.lineage,
    }),
    errors: Object.freeze(errors),
  });
}

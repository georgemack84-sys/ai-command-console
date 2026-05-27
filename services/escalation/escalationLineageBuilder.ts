import type { EscalationDecision, EscalationLineageEntry, EscalationReplayGraph } from "@/types/escalation";
import { hashEscalationCoordinationValue } from "./escalationHasher";

export function buildEscalationLineageEntry(input: {
  decision: EscalationDecision;
  replayGraph: EscalationReplayGraph;
}): EscalationLineageEntry {
  return Object.freeze({
    entryId: hashEscalationCoordinationValue("escalation-lineage-entry-id", {
      escalationId: input.decision.escalationId,
      createdAt: input.decision.createdAt,
    }),
    escalationId: input.decision.escalationId,
    coordinationId: input.decision.coordinationId,
    state: input.decision.resultingState,
    severity: input.decision.severity,
    replayGraphHash: input.replayGraph.graphHash,
    createdAt: input.decision.createdAt,
  });
}

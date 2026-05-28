import type { EscalationLineageLedger, EscalationStateTimeline } from "@/types/escalation";
import { hashEscalationCoordinationValue } from "@/services/escalation/escalationHasher";

export function buildEscalationTimeline(input: {
  coordinationId: string;
  lineage: EscalationLineageLedger;
}): EscalationStateTimeline {
  const states = Object.freeze(
    [...input.lineage.entries]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.entryId.localeCompare(b.entryId))
      .map((entry) => Object.freeze({
        escalationId: entry.escalationId,
        state: entry.state,
        severity: entry.severity,
        createdAt: entry.createdAt,
      })),
  );
  return Object.freeze({
    coordinationId: input.coordinationId,
    states,
    timelineHash: hashEscalationCoordinationValue("escalation-timeline", {
      coordinationId: input.coordinationId,
      states,
    }),
  });
}

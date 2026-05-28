import type { GovernanceAwareEscalationRecord } from "@/types/escalation";
import type { EscalationInspection } from "@/types/human-supremacy";
import { hashInterventionValue } from "@/services/human-supremacy/interventionHasher";

export function inspectEscalationLineage(input: {
  coordinationId: string;
  escalationRecord: GovernanceAwareEscalationRecord;
}): EscalationInspection {
  return Object.freeze({
    escalationLineageId: hashInterventionValue("escalation-lineage-inspection-id", {
      coordinationId: input.coordinationId,
      escalationId: input.escalationRecord.decision.escalationId,
    }),
    coordinationId: input.coordinationId,
    escalationId: input.escalationRecord.decision.escalationId,
    severity: input.escalationRecord.decision.severity,
    state: input.escalationRecord.decision.resultingState,
    inspectionHash: hashInterventionValue("escalation-lineage-inspection", {
      coordinationId: input.coordinationId,
      escalationId: input.escalationRecord.decision.escalationId,
      severity: input.escalationRecord.decision.severity,
      state: input.escalationRecord.decision.resultingState,
    }),
  });
}

import type { EscalationAwareCoordinationResult } from "@/types/escalation-aware-coordination";
import type { EscalationRationaleInspection } from "@/types/human-coordination-override";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

export function inspectEscalationRationale(
  escalation: EscalationAwareCoordinationResult,
): EscalationRationaleInspection {
  const base = Object.freeze({
    escalationId: escalation.record.escalationId,
    escalationLineageId: escalation.lineage.lineageId,
    escalationState: escalation.record.escalationState,
    escalationReason: escalation.record.escalationReason,
    rationaleCodes: Object.freeze(escalation.errors.map((error) => error.code)),
  });
  return Object.freeze({
    ...base,
    inspectionHash: hashCoordinationReplayValue("human-override-escalation-inspection", base),
  });
}

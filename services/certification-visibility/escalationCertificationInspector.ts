import type { EscalationAwareCoordinationResult } from "@/types/escalation-aware-coordination";
import type { EscalationCertificationInspection } from "@/types/coordination-readiness-certification";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

export function inspectEscalationCertification(escalation: EscalationAwareCoordinationResult): EscalationCertificationInspection {
  const base = Object.freeze({
    escalationId: escalation.record.escalationId,
    escalationLineageId: escalation.lineage.lineageId,
    escalationState: escalation.record.escalationState,
  });
  return Object.freeze({
    ...base,
    inspectionHash: hashCoordinationReplayValue("coordination-readiness-escalation-inspection", base),
  });
}

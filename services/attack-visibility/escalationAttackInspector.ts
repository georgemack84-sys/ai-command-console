import type { EscalationAwareCoordinationResult } from "@/types/escalation-aware-coordination";
import type { EscalationAttackInspection } from "@/types/constitutional-attack-engine";
import { hashConstitutionalAttackValue } from "@/services/constitutional-attack-engine/deterministicAttackHasher";

export function inspectEscalationAttack(escalation: EscalationAwareCoordinationResult): EscalationAttackInspection {
  const base = Object.freeze({
    escalationId: escalation.record.escalationId,
    escalationState: escalation.record.escalationState,
    escalationLineageId: escalation.lineage.lineageId,
  });
  return Object.freeze({
    ...base,
    inspectionHash: hashConstitutionalAttackValue("escalation-inspection", base),
  });
}

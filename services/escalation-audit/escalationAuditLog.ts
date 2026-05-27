import type { EscalationAuditRecord, EscalationAwareCoordinationResult } from "@/types/escalation-aware-coordination";

export function buildEscalationAuditLog(result: EscalationAwareCoordinationResult): readonly EscalationAuditRecord[] {
  return Object.freeze([result.audit]);
}

import type { EscalationAuditRecord, EscalationCoordinationState } from "./contracts/escalationTypes";

export function buildEscalationAuditRecord(state: EscalationCoordinationState): EscalationAuditRecord {
  return {
    auditId: `audit_${state.escalationId}`,
    escalationId: state.escalationId,
    escalationLineageId: state.escalationLineageId,
    eventType:
      state.blocked ? "escalation.blocked.insufficient_evidence"
        : state.frozen ? "escalation.frozen"
          : state.escalationState === "EMERGENCY" ? "escalation.emergency.triggered"
            : state.escalationState === "CONTAINED" ? "escalation.contained"
              : "escalation.created",
    evidence: [...state.evidence],
    reason: state.escalationReason,
    source: state.escalationSource,
    frozen: state.frozen,
    blocked: state.blocked,
    timestamp: state.timestamp,
  };
}

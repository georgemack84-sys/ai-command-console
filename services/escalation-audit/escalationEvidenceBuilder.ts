import type { EscalationAuditRecord, EscalationAwareCoordinationInput } from "@/types/escalation-aware-coordination";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

export function buildEscalationEvidence(input: {
  escalationInput: EscalationAwareCoordinationInput;
  target: string;
  reasons: readonly string[];
}): EscalationAuditRecord {
  const base = Object.freeze({
    auditId: hashCoordinationReplayValue("escalation-audit-id", {
      escalationId: input.escalationInput.escalationId,
      coordinationId: input.escalationInput.coordinationRecord.coordinationId,
    }),
    escalationId: input.escalationInput.escalationId,
    coordinationId: input.escalationInput.coordinationRecord.coordinationId,
    governanceSnapshotId: input.escalationInput.coordinationRecord.governanceSnapshotId,
    replaySnapshotId: input.escalationInput.coordinationRecord.replaySnapshotId,
    approvalSnapshotId: input.escalationInput.approval.approvalId,
    reasons: Object.freeze([...input.reasons].sort()),
    target: input.target,
  });
  return Object.freeze({
    ...base,
    evidenceHash: hashCoordinationReplayValue("escalation-audit-record", base),
  });
}

import type {
  ApprovalConflictEvidenceRecord,
  ApprovalConflictStressInput,
  ApprovalConflictReplayInspection,
  EscalationConflictInspection,
  GovernanceConflictInspection,
} from "@/types/approval-conflict";
import { hashApprovalConflictValue } from "./deterministicApprovalConflictHasher";

export function buildApprovalConflictEvidence(input: {
  conflictInput: ApprovalConflictStressInput;
  governanceInspection: GovernanceConflictInspection;
  escalationInspection: EscalationConflictInspection;
  replayInspection: ApprovalConflictReplayInspection;
  reasons: readonly string[];
}): ApprovalConflictEvidenceRecord {
  const base = Object.freeze({
    conflictId: input.conflictInput.conflictId,
    recommendationId: input.conflictInput.recommendationResult.record.recommendationId,
    attackId: input.conflictInput.recommendationResult.record.attackId,
    coordinationId: input.conflictInput.recommendationResult.record.coordinationId,
    governanceSnapshotId: input.conflictInput.recommendationResult.record.governanceSnapshotId,
    replaySnapshotId: input.conflictInput.recommendationResult.record.replaySnapshotId,
    escalationSnapshotId: input.conflictInput.recommendationResult.record.escalationSnapshotId,
    recommendationLineageId: input.conflictInput.recommendationResult.lineage.lineageId,
    attackLineageId: input.conflictInput.recommendationResult.evidence.attackLineageId,
    reasons: Object.freeze([...input.reasons]),
  });
  return Object.freeze({
    evidenceId: hashApprovalConflictValue("evidence-id", base),
    ...base,
    evidenceHash: hashApprovalConflictValue("evidence", {
      ...base,
      governanceInspectionHash: input.governanceInspection.inspectionHash,
      escalationInspectionHash: input.escalationInspection.inspectionHash,
      replayInspectionHash: input.replayInspection.inspectionHash,
    }),
  });
}

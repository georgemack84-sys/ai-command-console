import type {
  ConstitutionalReplayAttackInput,
  ConstitutionalReplayEvidenceRecord,
  ConstitutionalReplayInspection,
  EvidenceReplayInspection,
  GovernanceReplayAttackInspection,
} from "@/types/constitutional-replay";
import { hashConstitutionalReplayValue } from "./deterministicReplayHasher";

export function buildReplayAttackEvidence(input: {
  replayAttackInput: ConstitutionalReplayAttackInput;
  governanceInspection: GovernanceReplayAttackInspection;
  evidenceInspection: EvidenceReplayInspection;
  replayInspection: ConstitutionalReplayInspection;
  reasons: readonly string[];
}): ConstitutionalReplayEvidenceRecord {
  const base = Object.freeze({
    replayAttackId: input.replayAttackInput.replayAttackId,
    conflictId: input.replayAttackInput.approvalConflictResult.record.conflictId,
    recommendationId: input.replayAttackInput.approvalConflictResult.record.recommendationId,
    attackId: input.replayAttackInput.approvalConflictResult.record.attackId,
    coordinationId: input.replayAttackInput.approvalConflictResult.record.coordinationId,
    governanceSnapshotId: input.replayAttackInput.approvalConflictResult.record.governanceSnapshotId,
    replaySnapshotId: input.replayAttackInput.approvalConflictResult.record.replaySnapshotId,
    escalationSnapshotId: input.replayAttackInput.approvalConflictResult.record.escalationSnapshotId,
    approvalConflictLineageId: input.replayAttackInput.approvalConflictResult.lineage.lineageId,
    recommendationLineageId: input.replayAttackInput.approvalConflictResult.evidence.recommendationLineageId,
    reasons: Object.freeze([...input.reasons]),
  });
  return Object.freeze({
    evidenceId: hashConstitutionalReplayValue("evidence-id", base),
    ...base,
    evidenceHash: hashConstitutionalReplayValue("evidence", {
      ...base,
      governanceInspectionHash: input.governanceInspection.inspectionHash,
      evidenceInspectionHash: input.evidenceInspection.inspectionHash,
      replayInspectionHash: input.replayInspection.inspectionHash,
    }),
  });
}

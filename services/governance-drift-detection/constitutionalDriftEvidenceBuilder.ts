import type {
  EscalationDriftInspection,
  GovernanceDriftBoundaryInspection,
  GovernanceDriftEvidenceRecord,
  GovernanceDriftInput,
  RecommendationDriftInspection,
  ReplayDriftInspection,
} from "@/types/governance-drift";
import { hashGovernanceDriftValue } from "./deterministicDriftHasher";

export function buildGovernanceDriftEvidence(input: {
  driftInput: GovernanceDriftInput;
  replayInspection: ReplayDriftInspection;
  escalationInspection: EscalationDriftInspection;
  recommendationInspection: RecommendationDriftInspection;
  boundaryInspection: GovernanceDriftBoundaryInspection;
  reasons: readonly string[];
}): GovernanceDriftEvidenceRecord {
  const base = Object.freeze({
    driftId: input.driftInput.driftId,
    replayAttackId: input.driftInput.replayAttackResult.record.replayAttackId,
    conflictId: input.driftInput.replayAttackResult.record.conflictId,
    recommendationId: input.driftInput.replayAttackResult.record.recommendationId,
    attackId: input.driftInput.replayAttackResult.record.attackId,
    coordinationId: input.driftInput.replayAttackResult.record.coordinationId,
    governanceSnapshotId: input.driftInput.replayAttackResult.record.governanceSnapshotId,
    replaySnapshotId: input.driftInput.replayAttackResult.record.replaySnapshotId,
    escalationSnapshotId: input.driftInput.replayAttackResult.record.escalationSnapshotId,
    replayLineageId: input.driftInput.replayAttackResult.lineage.lineageId,
    approvalConflictLineageId: input.driftInput.replayAttackResult.evidence.approvalConflictLineageId,
    reasons: Object.freeze([...input.reasons]),
  });
  return Object.freeze({
    evidenceId: hashGovernanceDriftValue("evidence-id", base),
    ...base,
    evidenceHash: hashGovernanceDriftValue("evidence", {
      ...base,
      replayInspectionHash: input.replayInspection.inspectionHash,
      escalationInspectionHash: input.escalationInspection.inspectionHash,
      recommendationInspectionHash: input.recommendationInspection.inspectionHash,
      boundaryInspectionHash: input.boundaryInspection.inspectionHash,
    }),
  });
}

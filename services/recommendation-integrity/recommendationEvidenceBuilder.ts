import type {
  EscalationIntegrityInspection,
  GovernanceBindingInspection,
  RecommendationEvidenceRecord,
  RecommendationIntegrityInput,
  RecommendationReplayInspection,
} from "@/types/recommendation-integrity";
import { hashRecommendationIntegrityValue } from "./deterministicRecommendationHasher";

export function buildRecommendationEvidence(input: {
  recommendationInput: RecommendationIntegrityInput;
  governanceInspection: GovernanceBindingInspection;
  escalationInspection: EscalationIntegrityInspection;
  replayInspection: RecommendationReplayInspection;
  reasons: readonly string[];
}): RecommendationEvidenceRecord {
  const base = Object.freeze({
    recommendationId: input.recommendationInput.recommendationId,
    coordinationId: input.recommendationInput.attackResult.record.coordinationId,
    attackId: input.recommendationInput.attackResult.record.attackId,
    governanceSnapshotId: input.recommendationInput.attackResult.record.governanceSnapshotId,
    replaySnapshotId: input.recommendationInput.attackResult.record.replaySnapshotId,
    escalationSnapshotId: input.recommendationInput.attackResult.record.escalationSnapshotId,
    attackLineageId: input.recommendationInput.attackResult.lineage.lineageId,
    readinessLineageId: input.recommendationInput.attackResult.evidence.certificationLineageId,
    reasons: Object.freeze([...input.reasons]),
  });
  return Object.freeze({
    evidenceId: hashRecommendationIntegrityValue("evidence-id", base),
    ...base,
    evidenceHash: hashRecommendationIntegrityValue("evidence", {
      ...base,
      governanceInspectionHash: input.governanceInspection.inspectionHash,
      escalationInspectionHash: input.escalationInspection.inspectionHash,
      replayInspectionHash: input.replayInspection.inspectionHash,
    }),
  });
}

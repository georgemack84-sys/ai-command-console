import type {
  RecommendationLineageEvidence,
  RecommendationLineageInput,
} from "./recommendationLineageStateTypes";
import { hashRecommendationLineageValue } from "./lineageGraphHasher";

export function generateRecommendationLineageEvidence(input: {
  lineageInput: RecommendationLineageInput;
  reasons: readonly string[];
}): RecommendationLineageEvidence {
  const evidenceRefs = Object.freeze([
    ...input.lineageInput.evidenceSnapshots.map((snapshot) => snapshot.snapshotId),
    input.lineageInput.constitutionalReadinessResult.record.governanceSnapshotId,
    input.lineageInput.scoringSnapshot.scoringSnapshotId,
    input.lineageInput.policySnapshot.policySnapshotId,
    input.lineageInput.approvalSnapshot.approvalSnapshotId,
    input.lineageInput.constitutionalReadinessResult.record.replaySnapshotId,
  ]);
  return Object.freeze({
    evidenceId: hashRecommendationLineageValue("recommendation-lineage-evidence-id", {
      recommendationId: input.lineageInput.recommendationId,
    }),
    recommendationId: input.lineageInput.recommendationId,
    evidenceRefs,
    reasons: Object.freeze(input.reasons),
    evidenceHash: hashRecommendationLineageValue("recommendation-lineage-evidence", {
      recommendationId: input.lineageInput.recommendationId,
      evidenceRefs,
      reasons: input.reasons,
    }),
  });
}

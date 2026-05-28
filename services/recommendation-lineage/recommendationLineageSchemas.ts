import type {
  RecommendationLineageError,
  RecommendationLineageInput,
} from "./recommendationLineageStateTypes";

export function validateRecommendationLineageInput(
  input: RecommendationLineageInput,
): readonly RecommendationLineageError[] {
  const errors: RecommendationLineageError[] = [];
  if (!input.recommendationId) {
    errors.push({
      code: "RECOMMENDATION_LINEAGE_SCHEMA_INVALID",
      message: "Recommendation id is required.",
      path: "recommendationId",
    });
  }
  if (!input.lineageId) {
    errors.push({
      code: "RECOMMENDATION_LINEAGE_SCHEMA_INVALID",
      message: "Lineage id is required.",
      path: "lineageId",
    });
  }
  if (input.evidenceSnapshots.length === 0) {
    errors.push({
      code: "RECOMMENDATION_LINEAGE_EVIDENCE_GAP",
      message: "At least one evidence snapshot is required.",
      path: "evidenceSnapshots",
    });
  }
  if (!input.scoringSnapshot.scoringSnapshotId) {
    errors.push({
      code: "RECOMMENDATION_LINEAGE_SCHEMA_INVALID",
      message: "Scoring snapshot id is required.",
      path: "scoringSnapshot.scoringSnapshotId",
    });
  }
  if (!input.policySnapshot.policySnapshotId) {
    errors.push({
      code: "RECOMMENDATION_LINEAGE_SCHEMA_INVALID",
      message: "Policy snapshot id is required.",
      path: "policySnapshot.policySnapshotId",
    });
  }
  if (!input.approvalSnapshot.approvalSnapshotId) {
    errors.push({
      code: "RECOMMENDATION_LINEAGE_SCHEMA_INVALID",
      message: "Approval snapshot id is required.",
      path: "approvalSnapshot.approvalSnapshotId",
    });
  }
  return Object.freeze(errors);
}

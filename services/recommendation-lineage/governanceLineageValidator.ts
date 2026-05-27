import type {
  GovernanceLineageRecord,
  RecommendationLineageError,
} from "./recommendationLineageStateTypes";

export function validateGovernanceLineage(
  record: GovernanceLineageRecord,
): readonly RecommendationLineageError[] {
  if (record.governanceBound && record.governanceSnapshotId) {
    return Object.freeze([]);
  }
  return Object.freeze([{
    code: "RECOMMENDATION_LINEAGE_GOVERNANCE_MISMATCH",
    message: "Governance ancestry could not be certified.",
    path: "governanceSnapshotId",
  }]);
}

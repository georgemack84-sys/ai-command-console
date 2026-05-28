import type {
  GovernanceLineageRecord,
  RecommendationLineageError,
  RecommendationLineageInput,
} from "./recommendationLineageStateTypes";

export function detectGovernanceDrift(input: {
  lineageInput: RecommendationLineageInput;
  record: GovernanceLineageRecord;
}): readonly RecommendationLineageError[] {
  if (input.lineageInput.metadata?.governanceSubstitution === true || !input.record.governanceBound) {
    return Object.freeze([{
      code: "RECOMMENDATION_LINEAGE_GOVERNANCE_MISMATCH",
      message: "Governance lineage drift or substitution was detected.",
      path: "governanceSnapshotId",
    }]);
  }
  return Object.freeze([]);
}

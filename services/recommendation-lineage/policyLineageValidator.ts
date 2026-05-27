import type {
  PolicyLineageRecord,
  RecommendationLineageError,
} from "./recommendationLineageStateTypes";

export function validatePolicyLineage(
  record: PolicyLineageRecord,
): readonly RecommendationLineageError[] {
  if (record.applicablePolicies.length === 0 || record.conflictPolicies.length > 0) {
    return Object.freeze([{
      code: "RECOMMENDATION_LINEAGE_POLICY_SUBSTITUTION",
      message: "Policy lineage is incomplete or conflicted.",
      path: "policySnapshot",
    }]);
  }
  return Object.freeze([]);
}

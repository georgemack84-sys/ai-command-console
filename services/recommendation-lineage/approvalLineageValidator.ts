import type {
  ApprovalLineageRecord,
  RecommendationLineageError,
} from "./recommendationLineageStateTypes";

export function validateApprovalLineage(
  record: ApprovalLineageRecord,
): readonly RecommendationLineageError[] {
  const errors: RecommendationLineageError[] = [];
  if (record.approvalDependencies.length === 0) {
    errors.push({
      code: "RECOMMENDATION_LINEAGE_APPROVAL_AMBIGUOUS",
      message: "Approval ancestry is incomplete.",
      path: "approvalSnapshot",
    });
  }
  if (record.operatorInterventions.length === 0) {
    errors.push({
      code: "RECOMMENDATION_LINEAGE_OPERATOR_INTERVENTION_MISSING",
      message: "Operator intervention lineage is required.",
      path: "approvalSnapshot.operatorInterventions",
    });
  }
  return Object.freeze(errors);
}

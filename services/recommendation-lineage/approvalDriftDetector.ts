import type {
  ApprovalLineageRecord,
  RecommendationLineageError,
  RecommendationLineageInput,
} from "./recommendationLineageStateTypes";

export function detectApprovalDrift(input: {
  lineageInput: RecommendationLineageInput;
  record: ApprovalLineageRecord;
}): readonly RecommendationLineageError[] {
  if (input.lineageInput.metadata?.approvalInheritanceCorruption === true || input.record.approvalRevocations.length > input.record.approvalDependencies.length) {
    return Object.freeze([{
      code: "RECOMMENDATION_LINEAGE_APPROVAL_AMBIGUOUS",
      message: "Approval lineage drift or corruption was detected.",
      path: "approvalSnapshot",
    }]);
  }
  return Object.freeze([]);
}

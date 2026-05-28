import type {
  RecommendationSynthesisError,
  RecommendationSynthesisInput,
} from "./types/recommendationSynthesisTypes";

export function correlateRecommendationGovernance(
  input: RecommendationSynthesisInput,
): readonly RecommendationSynthesisError[] {
  const governanceSnapshotId = input.recommendationValidationResult.result.governanceSnapshotId;
  const transitionGovernanceId = input.constitutionalTransitionResult.transition.governanceBasisId;

  if (!governanceSnapshotId || !transitionGovernanceId) {
    return Object.freeze([{
      code: "RECOMMENDATION_SYNTHESIS_GOVERNANCE_AMBIGUITY",
      message: "Governance basis must be present for synthesis.",
      path: "governance",
    }]);
  }

  if (governanceSnapshotId !== transitionGovernanceId) {
    return Object.freeze([{
      code: "RECOMMENDATION_SYNTHESIS_GOVERNANCE_AMBIGUITY",
      message: "Governance snapshot mismatch between validation and transition artifacts.",
      path: "governanceSnapshotId",
    }]);
  }

  return Object.freeze([]);
}

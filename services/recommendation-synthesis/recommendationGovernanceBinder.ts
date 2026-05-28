import { hashRecommendationValue } from "./recommendationHashEngine";
import type {
  RecommendationGovernanceBinding,
  RecommendationSynthesisInput,
} from "./types/recommendationSynthesisTypes";

export function bindRecommendationGovernance(
  input: RecommendationSynthesisInput,
): readonly RecommendationGovernanceBinding[] {
  const binding = Object.freeze({
    bindingId: `${input.synthesisId}:governance-binding`,
    governanceSnapshotId: input.recommendationValidationResult.result.governanceSnapshotId,
    governanceHash: input.decisionReadinessCertificationResult.governanceRecord.governanceHash,
    policySnapshotId: input.constitutionalTransitionResult.transition.policySnapshotId,
    bindingHash: hashRecommendationValue("recommendation-synthesis-governance-binding", {
      governanceSnapshotId: input.recommendationValidationResult.result.governanceSnapshotId,
      governanceHash: input.decisionReadinessCertificationResult.governanceRecord.governanceHash,
      policySnapshotId: input.constitutionalTransitionResult.transition.policySnapshotId,
    }),
  } satisfies RecommendationGovernanceBinding);
  return Object.freeze([binding]);
}

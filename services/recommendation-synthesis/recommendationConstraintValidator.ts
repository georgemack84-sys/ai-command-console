import type {
  RecommendationSynthesisError,
  RecommendationSynthesisInput,
} from "./types/recommendationSynthesisTypes";

export function validateRecommendationConstraints(
  input: RecommendationSynthesisInput,
): readonly RecommendationSynthesisError[] {
  const errors: RecommendationSynthesisError[] = [];

  if (!input.decisionReadinessCertificationResult.certification.replayDeterminismVerified) {
    errors.push({
      code: "RECOMMENDATION_SYNTHESIS_REPLAY_MISMATCH",
      message: "Replay determinism must be certified before synthesis.",
      path: "decisionReadinessCertificationResult.certification.replayDeterminismVerified",
    });
  }
  if (!input.decisionReadinessCertificationResult.certification.capabilityContainmentVerified) {
    errors.push({
      code: "RECOMMENDATION_SYNTHESIS_CONTAINMENT_INVALID",
      message: "Capability containment must remain certified.",
      path: "decisionReadinessCertificationResult.certification.capabilityContainmentVerified",
    });
  }

  return Object.freeze(errors);
}

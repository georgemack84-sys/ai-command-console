import type {
  RecommendationSynthesisError,
  RecommendationSynthesisInput,
} from "./types/recommendationSynthesisTypes";

export function validateRecommendationIntegrity(
  input: RecommendationSynthesisInput,
): readonly RecommendationSynthesisError[] {
  const errors: RecommendationSynthesisError[] = [];
  if (!input.integrityStateId) {
    errors.push({
      code: "RECOMMENDATION_SYNTHESIS_LINEAGE_INSTABILITY",
      message: "Integrity state identifier is required.",
      path: "integrityStateId",
    });
  }
  if (!input.proposalIntegrityResult.sealedRecord.immutable) {
    errors.push({
      code: "RECOMMENDATION_SYNTHESIS_LINEAGE_INSTABILITY",
      message: "Proposal integrity result must remain immutable.",
      path: "proposalIntegrityResult.sealedRecord.immutable",
    });
  }
  return Object.freeze(errors);
}

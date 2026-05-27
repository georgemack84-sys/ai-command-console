import { validateRecommendationOperatorAuthority } from "@/services/recommendation-synthesis/recommendationOperatorAuthorityValidator";
import type { EvidenceAggregationError, EvidenceAggregationInput } from "./types/evidenceAggregationTypes";

export function validateEvidenceOperatorAuthority(
  input: EvidenceAggregationInput,
): readonly EvidenceAggregationError[] {
  return Object.freeze(
    validateRecommendationOperatorAuthority(input.recommendationSynthesisInput).map((error) => ({
      code: "EVIDENCE_AGGREGATION_OPERATOR_SUPPRESSED" as const,
      message: error.message,
      path: error.path,
    })),
  );
}

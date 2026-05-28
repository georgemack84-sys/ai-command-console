import { buildRecommendationEvidenceReferences } from "./recommendationEvidenceReferenceModel";
import { normalizeRecommendationEvidence } from "./recommendationEvidenceNormalizer";
import { orderRecommendationEvidence } from "./recommendationEvidenceOrderingEngine";
import type {
  RecommendationEvidenceReference,
  RecommendationSynthesisInput,
} from "./types/recommendationSynthesisTypes";

export function correlateRecommendationEvidence(
  input: RecommendationSynthesisInput,
): readonly RecommendationEvidenceReference[] {
  return buildRecommendationEvidenceReferences(
    orderRecommendationEvidence(normalizeRecommendationEvidence(input)),
  );
}

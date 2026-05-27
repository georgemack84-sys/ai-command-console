import { canonicalizeRecommendationToString } from "@/services/recommendation-synthesis/recommendationCanonicalizer";
import { hashRecommendationValue } from "@/services/recommendation-synthesis/recommendationHashEngine";
import type { ConfidenceScore, ConfidenceSerializationRecord } from "./types/confidenceScoringTypes";

export function serializeConfidenceScore(score: ConfidenceScore): ConfidenceSerializationRecord {
  const canonicalForm = canonicalizeRecommendationToString(score);
  return Object.freeze({
    serializationId: `${score.confidenceId}:serialization`,
    canonicalForm,
    serializationHash: hashRecommendationValue("confidence-scoring-serialization", canonicalForm),
  });
}

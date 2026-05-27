import { canonicalizeRecommendationToString } from "./recommendationCanonicalizer";
import { hashRecommendationValue } from "./recommendationHashEngine";
import type {
  RecommendationEnvelope,
  RecommendationSerializationRecord,
} from "./types/recommendationSynthesisTypes";

export function serializeRecommendationEnvelope(
  envelope: Omit<RecommendationEnvelope, "serializationRecord">,
): RecommendationSerializationRecord {
  const canonicalForm = canonicalizeRecommendationToString(envelope);
  return Object.freeze({
    serializationId: `${envelope.recommendation.recommendationId}:serialization`,
    serializationFormat: "json",
    canonicalForm,
    serializationHash: hashRecommendationValue("recommendation-synthesis-serialization", canonicalForm),
  });
}

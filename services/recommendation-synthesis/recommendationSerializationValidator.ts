import { serializeRecommendationEnvelope } from "./recommendationSerializationEngine";
import type {
  RecommendationEnvelope,
  RecommendationSynthesisError,
} from "./types/recommendationSynthesisTypes";

export function validateRecommendationSerialization(
  envelope: RecommendationEnvelope,
): readonly RecommendationSynthesisError[] {
  const { serializationRecord: _serializationRecord, ...serializableEnvelope } = envelope;
  const replayed = serializeRecommendationEnvelope(serializableEnvelope);
  if (replayed.serializationHash !== envelope.serializationRecord.serializationHash) {
    return Object.freeze([{
      code: "RECOMMENDATION_SYNTHESIS_SERIALIZATION_DRIFT",
      message: "Recommendation serialization drift detected.",
      path: "serializationRecord.serializationHash",
    }]);
  }
  return Object.freeze([]);
}

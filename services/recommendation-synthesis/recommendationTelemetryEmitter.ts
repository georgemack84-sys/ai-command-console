import { hashRecommendationValue } from "./recommendationHashEngine";
import type {
  RecommendationSynthesisInput,
  RecommendationSynthesisTelemetryRecord,
} from "./types/recommendationSynthesisTypes";

export function emitRecommendationTelemetry(
  input: RecommendationSynthesisInput,
): RecommendationSynthesisTelemetryRecord {
  const telemetryRefs = Object.freeze(input.telemetry.map((entry) => entry.telemetryId).sort((a, b) => a.localeCompare(b)));
  return Object.freeze({
    telemetryHash: hashRecommendationValue("recommendation-synthesis-telemetry", telemetryRefs),
    telemetryCount: telemetryRefs.length,
    telemetryRefs,
  });
}

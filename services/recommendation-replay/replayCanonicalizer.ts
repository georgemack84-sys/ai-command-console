import { canonicalizeRecommendationToString, canonicalizeRecommendationValue } from "@/services/recommendation-synthesis/recommendationCanonicalizer";

export function canonicalizeReplayValue<T>(value: T): T {
  return canonicalizeRecommendationValue(value);
}

export function canonicalizeReplayToString(value: unknown): string {
  return canonicalizeRecommendationToString(value);
}

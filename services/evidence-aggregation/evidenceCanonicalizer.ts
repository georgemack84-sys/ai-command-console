import {
  canonicalizeRecommendationToString,
  canonicalizeRecommendationValue,
} from "@/services/recommendation-synthesis/recommendationCanonicalizer";

export function canonicalizeEvidenceValue<T>(value: T): T {
  return canonicalizeRecommendationValue(value);
}

export function canonicalizeEvidenceToString(value: unknown): string {
  return canonicalizeRecommendationToString(value);
}

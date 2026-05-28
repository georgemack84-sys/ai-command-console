import { hashRecommendationValue } from "@/services/recommendation-synthesis/recommendationHashEngine";

export function hashEvidenceValue(scope: string, value: unknown): string {
  return hashRecommendationValue(scope, value);
}

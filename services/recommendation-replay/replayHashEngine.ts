import { hashRecommendationValue } from "@/services/recommendation-synthesis/recommendationHashEngine";

export function hashReplayValue(scope: string, value: unknown): string {
  return hashRecommendationValue(scope, value);
}

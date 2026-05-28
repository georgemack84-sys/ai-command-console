import { hashRecommendationLineageValue } from "./lineageGraphHasher";

export function hashReplayLineage(value: unknown): string {
  return hashRecommendationLineageValue("recommendation-lineage-replay", value);
}

import { hashRecommendationLineageValue } from "./lineageGraphHasher";

export function hashGovernanceLineage(value: unknown): string {
  return hashRecommendationLineageValue("recommendation-lineage-governance", value);
}

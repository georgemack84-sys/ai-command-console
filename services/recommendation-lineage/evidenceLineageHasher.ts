import { hashRecommendationLineageValue } from "./lineageGraphHasher";

export function hashEvidenceLineage(value: unknown): string {
  return hashRecommendationLineageValue("recommendation-lineage-evidence", value);
}

import type { RecommendationLineageInput } from "./recommendationLineageStateTypes";

export function trackConfidenceLineage(input: RecommendationLineageInput): readonly string[] {
  return Object.freeze([
    ...input.scoringSnapshot.confidenceReasoning,
    ...input.scoringSnapshot.uncertaintyFactors.map((factor) => `uncertainty:${factor}`),
  ]);
}

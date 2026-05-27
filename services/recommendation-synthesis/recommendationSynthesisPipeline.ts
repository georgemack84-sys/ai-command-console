import { RECOMMENDATION_SYNTHESIS_LIFECYCLE } from "./recommendationSynthesisContracts";

export function buildRecommendationSynthesisPipeline(): readonly string[] {
  return RECOMMENDATION_SYNTHESIS_LIFECYCLE;
}

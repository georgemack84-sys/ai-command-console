import type {
  RecommendationReplayMetadata,
  RecommendationSynthesisInput,
} from "./types/recommendationSynthesisTypes";
import { bindRecommendationReplay } from "./recommendationReplayBinder";

export function reconstructRecommendationReplay(
  input: RecommendationSynthesisInput,
): RecommendationReplayMetadata {
  return bindRecommendationReplay(input);
}

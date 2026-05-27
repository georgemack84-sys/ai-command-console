import { canonicalizeReplayToString } from "./replayCanonicalizer";
import type { RecommendationReplayEpisode } from "./types/recommendationReplayTypes";

export function serializeReplayEpisode(episode: RecommendationReplayEpisode): string {
  return canonicalizeReplayToString(episode);
}

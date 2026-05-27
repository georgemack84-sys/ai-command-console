import { hashRecommendationValue } from "./recommendationHashEngine";
import type {
  RecommendationReplayMetadata,
  RecommendationSynthesisInput,
} from "./types/recommendationSynthesisTypes";

export function bindRecommendationReplay(
  input: RecommendationSynthesisInput,
): RecommendationReplayMetadata {
  return Object.freeze({
    replayId: input.deterministicReplayResult.result.replayId,
    replaySnapshotId: input.deterministicReplayResult.snapshot.snapshotId,
    replayHash: input.deterministicReplayResult.result.replayHash,
    replayCertified: input.deterministicReplayResult.result.replayCertified,
    replayDeterministic: input.deterministicReplayResult.result.deterministic,
    replayMetadataHash: hashRecommendationValue("recommendation-synthesis-replay-metadata", {
      replayId: input.deterministicReplayResult.result.replayId,
      replaySnapshotId: input.deterministicReplayResult.snapshot.snapshotId,
      replayHash: input.deterministicReplayResult.result.replayHash,
      replayCertified: input.deterministicReplayResult.result.replayCertified,
      replayDeterministic: input.deterministicReplayResult.result.deterministic,
    }),
  });
}

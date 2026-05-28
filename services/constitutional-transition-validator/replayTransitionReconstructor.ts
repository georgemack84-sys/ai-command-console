import { hashConstitutionalTransitionValue } from "./transitionHashEngine";
import type { ConstitutionalTransitionInput, ConstitutionalTransitionReplayRecord } from "./types/constitutionalTransitionTypes";

export function reconstructReplayTransition(
  input: ConstitutionalTransitionInput,
): ConstitutionalTransitionReplayRecord {
  return Object.freeze({
    replayLineageId: input.replayLineageId,
    replaySnapshotId: input.replaySnapshotId,
    replayHash: input.deterministicReplayResult.result.replayHash,
    replayCertified: input.deterministicReplayResult.result.replayCertified,
    replayDeterministic: input.deterministicReplayResult.result.deterministic,
    reconstructedRecommendationHash: input.deterministicReplayResult.result.reconstructedRecommendationHash,
    replayRecordHash: hashConstitutionalTransitionValue("constitutional-transition-replay-record", {
      replayLineageId: input.replayLineageId,
      replaySnapshotId: input.replaySnapshotId,
      replayHash: input.deterministicReplayResult.result.replayHash,
      replayCertified: input.deterministicReplayResult.result.replayCertified,
      replayDeterministic: input.deterministicReplayResult.result.deterministic,
      reconstructedRecommendationHash: input.deterministicReplayResult.result.reconstructedRecommendationHash,
    }),
  });
}

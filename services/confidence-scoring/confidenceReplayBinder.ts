import { bindRecommendationReplay } from "@/services/recommendation-synthesis/recommendationReplayBinder";
import { hashRecommendationValue } from "@/services/recommendation-synthesis/recommendationHashEngine";
import type { ConfidenceReplayRecord, ConfidenceScoringInput, ReplayMetadata } from "./types/confidenceScoringTypes";

export function bindConfidenceReplayMetadata(input: ConfidenceScoringInput): ReplayMetadata {
  const replay = bindRecommendationReplay(input.recommendationSynthesisInput);
  return Object.freeze({
    replayId: replay.replayId,
    replaySnapshotId: replay.replaySnapshotId,
    replayHash: replay.replayHash,
    replayCertified: replay.replayCertified,
    replayDeterministic: replay.replayDeterministic,
    deterministicHash: hashRecommendationValue("confidence-scoring-replay-metadata", replay),
  });
}

export function buildConfidenceReplayRecord(input: ConfidenceScoringInput): ConfidenceReplayRecord {
  const replay = bindConfidenceReplayMetadata(input);
  return Object.freeze({
    replayId: replay.replayId,
    replaySnapshotId: replay.replaySnapshotId,
    replayHash: replay.replayHash,
    replayRestricted: replay.replayCertified && replay.replayDeterministic,
    replayRecordHash: hashRecommendationValue("confidence-scoring-replay-record", replay),
  });
}

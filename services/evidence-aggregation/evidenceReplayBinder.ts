import { bindRecommendationReplay } from "@/services/recommendation-synthesis/recommendationReplayBinder";
import { hashEvidenceValue } from "./evidenceHashEngine";
import type { EvidenceAggregationInput, EvidenceReplayRecord } from "./types/evidenceAggregationTypes";

export function bindEvidenceReplay(input: EvidenceAggregationInput): EvidenceReplayRecord {
  const replay = bindRecommendationReplay(input.recommendationSynthesisInput);
  return Object.freeze({
    replaySessionId: replay.replayId,
    replayHash: replay.replayHash,
    replaySnapshotId: replay.replaySnapshotId,
    replayDeterministic: replay.replayDeterministic,
    replayCertified: replay.replayCertified,
    replayRecordHash: hashEvidenceValue("evidence-replay-record", replay),
  });
}

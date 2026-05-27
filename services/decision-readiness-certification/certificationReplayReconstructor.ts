import { hashCertificationValue } from "./certificationHashEngine";
import type {
  DecisionReadinessCertificationInput,
  DecisionReadinessReplayRecord,
} from "./types/decisionReadinessCertificationTypes";

export function reconstructCertificationReplay(
  input: DecisionReadinessCertificationInput,
): DecisionReadinessReplayRecord {
  return Object.freeze({
    replayHash: input.deterministicReplayResult.result.replayHash,
    replayDeterministic: input.deterministicReplayResult.result.deterministic,
    replayCertified: input.deterministicReplayResult.result.replayCertified,
    recommendationHash: input.deterministicReplayResult.result.reconstructedRecommendationHash,
    replayRecordHash: hashCertificationValue("decision-readiness-replay-record", {
      replayHash: input.deterministicReplayResult.result.replayHash,
      replayDeterministic: input.deterministicReplayResult.result.deterministic,
      replayCertified: input.deterministicReplayResult.result.replayCertified,
      recommendationHash: input.deterministicReplayResult.result.reconstructedRecommendationHash,
    }),
  });
}

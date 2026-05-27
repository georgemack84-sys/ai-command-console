import { hashReplayValue } from "./replayHashEngine";
import type { RecommendationReplayError, RecommendationReplayFreezeRecord, RecommendationReplayStatus } from "./types/recommendationReplayTypes";

export function buildReplayFreezeRecord(errors: readonly RecommendationReplayError[]): RecommendationReplayFreezeRecord {
  const reasons = Object.freeze(errors.map((error) => error.code));
  const failedClosed = errors.some((error) =>
    error.code !== "RECOMMENDATION_REPLAY_GOVERNANCE_MISMATCH"
    && error.code !== "RECOMMENDATION_REPLAY_CONFIDENCE_INCONSISTENCY"
    && error.code !== "RECOMMENDATION_REPLAY_HASH_MISMATCH"
    && error.code !== "RECOMMENDATION_REPLAY_DRIFT",
  );

  return Object.freeze({
    frozen: errors.length > 0,
    failedClosed,
    reasons,
    freezeHash: hashReplayValue("recommendation-replay-freeze", { reasons, failedClosed }),
  });
}

export function deriveReplayStatus(freeze: RecommendationReplayFreezeRecord): RecommendationReplayStatus {
  if (freeze.failedClosed) return "FAILED_CLOSED";
  if (freeze.frozen) return "FROZEN";
  return "COMPLETED";
}

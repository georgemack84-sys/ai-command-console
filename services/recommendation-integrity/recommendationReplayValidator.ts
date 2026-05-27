import type { RecommendationIntegrityError, RecommendationIntegrityInput } from "@/types/recommendation-integrity";
import { buildRecommendationReplayInspection } from "./recommendationReplayEngine";

function error(
  code: RecommendationIntegrityError["code"],
  message: string,
  path?: string,
): RecommendationIntegrityError {
  return Object.freeze({ code, message, path });
}

export function validateRecommendationReplay(input: RecommendationIntegrityInput): {
  replayDeterministic: boolean;
  errors: readonly RecommendationIntegrityError[];
} {
  const inspection = buildRecommendationReplayInspection(input);
  const errors: RecommendationIntegrityError[] = [];
  if (!inspection.replayDeterministic || input.attackResult.record.attackState === "FAIL_CLOSED") {
    errors.push(error(
      "RECOMMENDATION_REPLAY_INCONSISTENT",
      "Recommendation replay was not reconstructable from immutable upstream attack evidence.",
      "attackResult.replayLedger",
    ));
  }
  return Object.freeze({
    replayDeterministic: inspection.replayDeterministic,
    errors: Object.freeze(errors),
  });
}

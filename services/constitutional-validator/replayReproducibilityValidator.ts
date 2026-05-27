import type { RecommendationValidationError, RecommendationValidationInput, RecommendationValidationStageRecord } from "./types/recommendationValidationTypes";
import { hashValidationValue } from "./validationHashEngine";

export function validateReplayReproducibility(input: RecommendationValidationInput): {
  stage: RecommendationValidationStageRecord;
  errors: readonly RecommendationValidationError[];
} {
  const valid =
    input.constitutionalCertificationResult.record.replaySafe
    && input.constitutionalReadinessResult.record.replaySafe
    && input.constitutionalReplayResult.record.replayDeterministic
    && input.recommendationLineageResult.replayLineage.replayCertified
    && input.metadata?.presentStateSubstitution !== true
    && input.metadata?.syntheticReplay !== true
    && input.metadata?.replayRepair !== true;
  const errors = valid
    ? []
    : [{
      code: "RECOMMENDATION_VALIDATION_REPLAY_INVALID" as const,
      message: "Replay reproducibility validation failed.",
      path: "replay",
    }];
  return Object.freeze({
    stage: Object.freeze({
      stage: "replay_reproducibility",
      passed: valid,
      reasons: Object.freeze(errors.map((error) => error.code)),
      deterministicHash: hashValidationValue("validation-stage-replay", {
        replayId: input.constitutionalReplayResult.record.replayId,
        replaySafe: input.constitutionalCertificationResult.record.replaySafe,
      }),
    }),
    errors: Object.freeze(errors),
  });
}

import type { RecommendationReplayInput, RecommendationReplayEpisode, RecommendationReplayError } from "./types/recommendationReplayTypes";

export function reconstructConfidenceReplay(
  input: RecommendationReplayInput,
): { confidenceReplay: RecommendationReplayEpisode["confidenceReplay"]; errors: RecommendationReplayError[] } {
  const confidence = input.confidenceScoringResult.confidenceScores.find((item) => item.recommendationId === input.recommendationId);
  if (!confidence) {
    return {
      confidenceReplay: {
        confidenceModelVersion: input.confidenceScoringInput.validatorVersionId,
        confidenceScore: 0,
        weightingLineage: [],
      },
      errors: [{
        code: "RECOMMENDATION_REPLAY_CONFIDENCE_INCONSISTENCY",
        message: "Replay could not reconstruct an immutable confidence score for the recommendation.",
        path: `recommendation.${input.recommendationId}.confidenceReplay`,
      }],
    };
  }

  return {
    confidenceReplay: {
      confidenceModelVersion: input.confidenceScoringInput.validatorVersionId,
      confidenceScore: confidence.overallConfidence,
      weightingLineage: [
        input.confidenceScoringResult.weightRecord.deterministicHash,
        ...confidence.scoringFactors.map((factor) => factor.deterministicHash),
      ],
    },
    errors: [],
  };
}

import type {
  ImmutableRecommendationLedgerInput,
  ImmutableRecommendationLedgerResult,
} from "@/services/immutable-recommendation-ledger/types/immutableRecommendationLedgerTypes";
import type {
  RecommendationReplayEpisode,
  RecommendationReplayInput,
  RecommendationReplayResult,
} from "@/services/recommendation-replay/types/recommendationReplayTypes";
import type { RecommendationReplay } from "./types/constitutionalEnforcementTypes";

function findReplayEpisode(
  replayResult: RecommendationReplayResult,
  recommendationId: string,
): RecommendationReplayEpisode | undefined {
  return replayResult.episodes.find((episode) => episode.recommendationId === recommendationId);
}

export function reconstructRecommendationReplay(input: {
  recommendationId: string;
  replayInput: RecommendationReplayInput;
  replayResult: RecommendationReplayResult;
  immutableLedgerInput: ImmutableRecommendationLedgerInput;
  immutableLedgerResult: ImmutableRecommendationLedgerResult;
  reconstructedAt: string;
}): RecommendationReplay {
  const episode = findReplayEpisode(input.replayResult, input.recommendationId)
    ?? input.replayResult.episodes[0]!;
  const synthesisEnvelope = input.replayInput.recommendationSynthesisResult.recommendations
    .find((entry) => entry.recommendation.recommendationId === input.recommendationId)
    ?? input.replayInput.recommendationSynthesisResult.recommendations[0]!;
  const constrained = input.replayInput.recommendationConstraintResult.constrainedRecommendations
    .find((entry) => entry.constrainedRecommendation.recommendationId === input.recommendationId);
  const confidence = input.replayInput.confidenceScoringResult.confidenceScores
    .find((entry) => entry.recommendationId === input.recommendationId);

  return Object.freeze({
    replayId: episode.replayId,
    recommendationId: input.recommendationId,
    reconstructedReasoning: [
      synthesisEnvelope.recommendation.summary,
      synthesisEnvelope.recommendation.rationale,
      constrained?.sanitizationRecord.sanitizedSummary ?? synthesisEnvelope.recommendation.summary,
      constrained?.sanitizationRecord.sanitizedRationale ?? synthesisEnvelope.recommendation.rationale,
    ].filter(Boolean),
    evidenceChain: [
      ...episode.evidenceReplay.normalizedEvidenceRefs,
    ],
    governanceChain: [
      episode.governanceReplay.governanceSnapshotId,
      episode.governanceReplay.policySnapshotId,
      ...input.immutableLedgerResult.events.map((event) => event.governanceSnapshotId),
    ],
    confidenceChain: [
      confidence?.confidenceId ?? "unknown-confidence-id",
      episode.confidenceReplay.confidenceModelVersion,
      ...episode.confidenceReplay.weightingLineage,
    ],
    reconstructedAt: input.reconstructedAt,
  });
}

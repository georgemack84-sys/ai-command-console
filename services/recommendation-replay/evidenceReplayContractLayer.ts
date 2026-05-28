import type { RecommendationReplayInput, RecommendationReplayError, RecommendationReplayEpisode } from "./types/recommendationReplayTypes";

export function reconstructEvidenceReplay(
  input: RecommendationReplayInput,
): { evidenceReplay: RecommendationReplayEpisode["evidenceReplay"]; errors: RecommendationReplayError[] } {
  const envelope = input.recommendationSynthesisResult.recommendations.find((item) => item.recommendation.recommendationId === input.recommendationId);
  const referencedIds = new Set((envelope?.evidenceReferences ?? []).map((item) => item.sourceId));
  const evidence = input.evidenceAggregationResult.evidenceReferences.filter((item) =>
    referencedIds.has(item.evidenceId) || referencedIds.has(item.sourceId),
  );

  if (evidence.length === 0) {
    return {
      evidenceReplay: {
        evidenceHashes: [],
        normalizedEvidenceRefs: [],
        deterministicOrdering: [],
      },
      errors: [{
        code: "RECOMMENDATION_REPLAY_EVIDENCE_MISMATCH",
        message: "Replay could not reconstruct immutable evidence references for the recommendation.",
        path: `recommendation.${input.recommendationId}.evidenceReplay`,
      }],
    };
  }

  const ordered = [...evidence].sort((left, right) =>
    left.evidenceType.localeCompare(right.evidenceType)
    || left.collectedAt.localeCompare(right.collectedAt)
    || left.canonicalHash.localeCompare(right.canonicalHash)
    || left.sourceId.localeCompare(right.sourceId)
    || left.schemaVersion.localeCompare(right.schemaVersion)
    || left.evidenceId.localeCompare(right.evidenceId),
  );

  return {
    evidenceReplay: {
      evidenceHashes: ordered.map((item) => item.canonicalHash),
      normalizedEvidenceRefs: ordered.map((item) => item.evidenceId),
      deterministicOrdering: ordered.map((item) => item.evidenceId),
    },
    errors: [],
  };
}

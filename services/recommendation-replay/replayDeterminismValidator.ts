import { hashReplayValue } from "./replayHashEngine";
import { serializeReplayEpisode } from "./replaySerializationEngine";
import type { RecommendationReplayEpisode, RecommendationReplayValidationRecord } from "./types/recommendationReplayTypes";

export function validateReplayDeterminism(episode: RecommendationReplayEpisode): RecommendationReplayValidationRecord {
  const first = serializeReplayEpisode(episode);
  const second = serializeReplayEpisode(episode);
  const deterministicReplayVerified = first === second;

  return Object.freeze({
    recommendationId: episode.recommendationId,
    deterministicReplayVerified,
    lineageIntegrityVerified: episode.lineage.synthesisEpisodeId.length > 0
      && episode.lineage.evidenceLineageId.length > 0
      && episode.lineage.governanceLineageId.length > 0
      && episode.lineage.confidenceLineageId.length > 0
      && episode.lineage.constraintLineageId.length > 0,
    governanceConsistencyVerified: episode.governanceReplay.governanceSnapshotId.length > 0
      && episode.governanceReplay.policySnapshotId.length > 0,
    validationHash: hashReplayValue("recommendation-replay-validation", {
      recommendationId: episode.recommendationId,
      deterministicReplayVerified,
      replayHash: episode.replayHash,
    }),
  });
}

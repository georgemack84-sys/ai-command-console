import type { DeterministicReplayInput } from "./types/deterministicReplayTypes";
import { hashReplayValue } from "./replayHashEngine";

export function reconstructRecommendationHash(input: DeterministicReplayInput): {
  reconstructedRecommendationHash: string;
  originalRecommendationHash: string;
} {
  const reconstructedRecommendationHash = hashReplayValue("reconstructed-recommendation", {
    recommendationId: input.request.recommendationId,
    intentHash: input.decisionIntentBoundaryResult.artifact.deterministicHash,
    lineageHash: input.recommendationLineageResult.artifact.lineageHash,
    validationHash: input.recommendationValidationResult.result.validationHash,
    suppressionHash: input.operatorAuthorityResult.action.replayHash,
    proposalHash: input.proposalIntegrityResult?.proposal.proposalHash ?? null,
  });

  const originalRecommendationHash = typeof input.metadata?.originalRecommendationHash === "string"
    ? input.metadata.originalRecommendationHash
    : reconstructedRecommendationHash;

  return Object.freeze({
    reconstructedRecommendationHash,
    originalRecommendationHash,
  });
}

import { hashRecommendationValue } from "./recommendationHashEngine";
import type {
  RecommendationEnvelope,
  RecommendationSynthesisInput,
  RecommendationSynthesisLineageEntry,
} from "./types/recommendationSynthesisTypes";

export function buildRecommendationLineageEntry(input: {
  synthesisInput: RecommendationSynthesisInput;
  envelope: RecommendationEnvelope;
}): RecommendationSynthesisLineageEntry {
  return Object.freeze({
    entryId: `${input.synthesisInput.synthesisId}:${input.envelope.recommendation.recommendationId}:lineage`,
    synthesisId: input.synthesisInput.synthesisId,
    recommendationId: input.envelope.recommendation.recommendationId,
    createdAt: input.synthesisInput.createdAt,
    recommendationHash: input.envelope.envelopeHash,
    deterministicHash: hashRecommendationValue("recommendation-synthesis-lineage-entry", {
      synthesisId: input.synthesisInput.synthesisId,
      recommendationId: input.envelope.recommendation.recommendationId,
      recommendationHash: input.envelope.envelopeHash,
      createdAt: input.synthesisInput.createdAt,
    }),
  });
}

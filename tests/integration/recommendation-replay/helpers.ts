import { replayRecommendationEpisode } from "@/services/recommendation-replay/recommendationReplayEngine";
import type { RecommendationReplayInput } from "@/services/recommendation-replay/types/recommendationReplayTypes";
import { buildRecommendationPrioritizationFixture } from "@/tests/integration/recommendation-prioritization/helpers";
import { buildRecommendationConstraintFixture } from "@/tests/integration/recommendation-constraint/helpers";
import { buildEvidenceAggregationFixture } from "@/tests/integration/evidence-aggregation/helpers";

export function buildRecommendationReplayFixture(
  overrides: Partial<RecommendationReplayInput> = {},
) {
  const prioritizationFixture = buildRecommendationPrioritizationFixture();
  const confidenceFixture = prioritizationFixture.confidenceFixture;
  const constraintFixture = buildRecommendationConstraintFixture();
  const evidenceFixture = buildEvidenceAggregationFixture();

  const recommendationId = prioritizationFixture.input.inputs[0]!.recommendationId;

  const baseInput = {
    replayRunId: "recommendation-replay-run-1",
    replayTimestamp: "2026-05-20T23:00:00.000Z",
    constitutionalVersion: "5.1F",
    recommendationId,
    recommendationSynthesisInput: confidenceFixture.input.recommendationSynthesisInput,
    recommendationSynthesisResult: confidenceFixture.input.recommendationSynthesisResult,
    evidenceAggregationInput: evidenceFixture.input,
    evidenceAggregationResult: confidenceFixture.input.evidenceAggregationResult,
    recommendationConstraintInput: constraintFixture.input,
    recommendationConstraintResult: confidenceFixture.input.recommendationConstraintResult,
    confidenceScoringInput: confidenceFixture.input,
    confidenceScoringResult: confidenceFixture.result,
    recommendationPrioritizationInput: prioritizationFixture.input,
    recommendationPrioritizationResult: prioritizationFixture.result,
  } satisfies RecommendationReplayInput;

  const input = Object.freeze({
    ...baseInput,
    ...overrides,
  }) as RecommendationReplayInput;

  return Object.freeze({
    prioritizationFixture,
    confidenceFixture,
    input,
    result: replayRecommendationEpisode(input),
  });
}

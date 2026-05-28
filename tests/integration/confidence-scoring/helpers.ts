import { scoreRecommendationConfidence } from "@/services/confidence-scoring/confidenceScoringEngine";
import type {
  ConfidenceScoringInput,
  ConfidenceScoringLedgerEntry,
  ConfidenceLineageLedger,
} from "@/services/confidence-scoring/types/confidenceScoringTypes";
import { buildRecommendationConstraintFixture } from "@/tests/integration/recommendation-constraint/helpers";

export function buildConfidenceScoringFixture(
  overrides: Partial<ConfidenceScoringInput> = {},
) {
  const constraintFixture = buildRecommendationConstraintFixture();
  const baseInput = {
    confidenceSessionId: "confidence-scoring-session-1",
    createdAt: "2026-05-20T21:00:00.000Z",
    constitutionalVersion: "5.1D",
    validatorVersionId: "confidence-scoring-validator-v1",
    recommendationSynthesisInput: constraintFixture.input.recommendationSynthesisInput,
    recommendationSynthesisResult: constraintFixture.input.recommendationSynthesisResult,
    recommendationConstraintResult: constraintFixture.result,
    evidenceAggregationResult: constraintFixture.input.evidenceAggregationResult,
  } satisfies ConfidenceScoringInput;

  const input = Object.freeze({
    ...baseInput,
    ...overrides,
  }) as ConfidenceScoringInput;

  return Object.freeze({
    input,
    result: scoreRecommendationConfidence({
      ...input,
      existingLineage: overrides.existingLineage as ConfidenceLineageLedger | undefined,
      existingAuditLedger: overrides.existingAuditLedger as readonly ConfidenceScoringLedgerEntry[] | undefined,
    }),
  });
}

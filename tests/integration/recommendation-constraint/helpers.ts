import { aggregateEvidence } from "@/services/evidence-aggregation/evidenceAggregationEngine";
import { constrainRecommendations } from "@/services/recommendation-constraint/recommendationConstraintEngine";
import type {
  RecommendationConstraintInput,
  RecommendationConstraintLedgerEntry,
} from "@/services/recommendation-constraint/types/recommendationConstraintTypes";
import { buildEvidenceAggregationFixture } from "@/tests/integration/evidence-aggregation/helpers";

export function buildRecommendationConstraintFixture(
  overrides: Partial<RecommendationConstraintInput> = {},
) {
  const evidenceFixture = buildEvidenceAggregationFixture();
  const evidenceResult = aggregateEvidence(evidenceFixture.input);
  const baseInput = {
    constraintSessionId: "recommendation-constraint-session-1",
    constrainedAt: "2026-05-20T20:00:00.000Z",
    constitutionalVersion: "5.1C",
    validatorVersionId: "recommendation-constraint-validator-v1",
    recommendationSynthesisInput: evidenceFixture.input.recommendationSynthesisInput,
    recommendationSynthesisResult: evidenceFixture.input.recommendationSynthesisResult,
    evidenceAggregationResult: evidenceResult,
  } satisfies RecommendationConstraintInput;

  const input = Object.freeze({
    ...baseInput,
    ...overrides,
  }) as RecommendationConstraintInput;

  return Object.freeze({
    input,
    result: constrainRecommendations({
      ...input,
      existingAuditLedger: overrides.existingAuditLedger as readonly RecommendationConstraintLedgerEntry[] | undefined,
    }),
  });
}

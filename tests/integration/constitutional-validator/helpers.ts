import { buildRecommendationLineageFixture } from "@/tests/integration/recommendation-lineage/helpers";
import { validateConstitutionalRecommendation } from "@/services/constitutional-validator/constitutionalRecommendationValidator";
import type {
  RecommendationValidationInput,
  RecommendationValidationLedgerEntry,
  RecommendationValidationLineageLedger,
} from "@/services/constitutional-validator/types/recommendationValidationTypes";

export function buildConstitutionalRecommendationValidationFixture(
  overrides: Partial<RecommendationValidationInput> = {},
) {
  const lineageFixture = buildRecommendationLineageFixture();
  const baseInput = {
    recommendationId: lineageFixture.input.recommendationId,
    decisionIntentBoundaryResult: lineageFixture.input.decisionIntentBoundaryResult,
    recommendationLineageResult: lineageFixture.result,
    constitutionalCertificationResult: lineageFixture.input.constitutionalCertificationResult,
    constitutionalReadinessResult: lineageFixture.input.constitutionalReadinessResult,
    constitutionalReplayResult: lineageFixture.input.constitutionalReplayResult,
    humanSupremacyResult: lineageFixture.input.humanSupremacyResult,
    escalationDeterminismResult: lineageFixture.input.escalationDeterminismResult,
    deterministicSeed: "recommendation-validation-seed-1",
    validatorVersionId: "validator-v1",
    validatedAt: "2026-05-19T12:00:00.000Z",
  } satisfies RecommendationValidationInput;

  const input = Object.freeze({
    ...baseInput,
    ...overrides,
  }) as RecommendationValidationInput;

  return Object.freeze({
    input,
    result: validateConstitutionalRecommendation({
      ...input,
      existingLineage: overrides.existingLineage as RecommendationValidationLineageLedger | undefined,
      existingAuditLedger: overrides.existingAuditLedger as readonly RecommendationValidationLedgerEntry[] | undefined,
    }),
  });
}

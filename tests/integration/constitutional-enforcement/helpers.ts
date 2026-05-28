import { enforceRecommendationConstitutionality } from "@/services/constitutional-enforcement/constitutionalEnforcementEngine";
import type { ConstitutionalEnforcementInput } from "@/services/constitutional-enforcement/types/constitutionalEnforcementTypes";
import { buildImmutableRecommendationLedgerFixture } from "@/tests/integration/immutable-recommendation-ledger/helpers";

function withSafeRecommendationLanguage(
  input: ConstitutionalEnforcementInput,
): ConstitutionalEnforcementInput {
  const recommendationId = input.recommendationId;
  const safeSummary = "Recommend operator review of the replay-certified containment finding.";
  const safeRationale = "Evidence indicates a bounded containment concern and recommends human oversight only.";

  const recommendationSynthesisResult = Object.freeze({
    ...input.replayInput.recommendationSynthesisResult,
    recommendations: Object.freeze(
      input.replayInput.recommendationSynthesisResult.recommendations.map((entry) =>
        entry.recommendation.recommendationId !== recommendationId
          ? entry
          : Object.freeze({
              ...entry,
              recommendation: Object.freeze({
                ...entry.recommendation,
                summary: safeSummary,
                rationale: safeRationale,
              }),
            })),
    ),
  });

  const recommendationConstraintResult = Object.freeze({
    ...input.replayInput.recommendationConstraintResult,
    constrainedRecommendations: Object.freeze(
      input.replayInput.recommendationConstraintResult.constrainedRecommendations.map((entry) =>
        entry.constrainedRecommendation.recommendationId !== recommendationId
          ? entry
          : Object.freeze({
              ...entry,
              constrainedRecommendation: Object.freeze({
                ...entry.constrainedRecommendation,
                summary: safeSummary,
                rationale: safeRationale,
              }),
              sanitizationRecord: Object.freeze({
                ...entry.sanitizationRecord,
                sanitizedSummary: safeSummary,
                sanitizedRationale: safeRationale,
              }),
            })),
    ),
  });

  return Object.freeze({
    ...input,
    replayInput: Object.freeze({
      ...input.replayInput,
      recommendationSynthesisResult,
      recommendationConstraintResult,
    }),
  });
}

export function buildConstitutionalEnforcementFixture(
  overrides: Partial<ConstitutionalEnforcementInput> = {},
) {
  const ledgerFixture = buildImmutableRecommendationLedgerFixture();
  const baseInput = withSafeRecommendationLanguage(Object.freeze({
    enforcementRunId: "constitutional-enforcement-run-1",
    evaluatedAt: "2026-05-21T01:00:00.000Z",
    constitutionalVersion: "5.1H",
    validatorVersionId: "constitutional-enforcement-validator-v1",
    recommendationId: ledgerFixture.input.replayInput.recommendationId,
    replayInput: ledgerFixture.input.replayInput,
    replayResult: ledgerFixture.input.replayResult,
    immutableLedgerInput: ledgerFixture.input,
    immutableLedgerResult: ledgerFixture.result,
  }) as ConstitutionalEnforcementInput);

  const input = Object.freeze({
    ...baseInput,
    ...overrides,
  }) as ConstitutionalEnforcementInput;

  return Object.freeze({
    ledgerFixture,
    replayFixture: ledgerFixture.replayFixture,
    input,
    result: enforceRecommendationConstitutionality(input),
  });
}

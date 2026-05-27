import { buildConstitutionalRecommendationValidationFixture } from "@/tests/integration/constitutional-validator/helpers";
import { buildOperatorAuthorityPreservation } from "@/services/operator-authority/operatorAuthorityEngine";
import type {
  OperatorAuthorityInput,
  OperatorAuthorityLedgerEntry,
  OperatorAuthorityLineageLedger,
} from "@/services/operator-authority/types/operatorAuthorityTypes";

export function buildOperatorAuthorityFixture(
  overrides: Partial<OperatorAuthorityInput> = {},
) {
  const validationFixture = buildConstitutionalRecommendationValidationFixture();
  const baseInput = {
    actionId: "operator-action-1",
    operatorId: "operator-1",
    actionType: "OVERRIDE",
    targetIds: Object.freeze([validationFixture.result.result.recommendationId]),
    scopeBoundaryIds: Object.freeze(["scope-boundary-1"]),
    recommendationValidationResult: validationFixture.result,
    constitutionalReplayResult: validationFixture.input.constitutionalReplayResult,
    humanSupremacyResult: validationFixture.input.humanSupremacyResult,
    escalationDeterminismResult: validationFixture.input.escalationDeterminismResult,
    validatedAt: "2026-05-19T13:00:00.000Z",
    deterministicSeed: "operator-authority-seed-1",
    validatorVersionId: "operator-authority-validator-v1",
  } satisfies OperatorAuthorityInput;

  const input = Object.freeze({
    ...baseInput,
    ...overrides,
  }) as OperatorAuthorityInput;

  return Object.freeze({
    input,
    result: buildOperatorAuthorityPreservation({
      ...input,
      existingLineage: overrides.existingLineage as OperatorAuthorityLineageLedger | undefined,
      existingAuditLedger: overrides.existingAuditLedger as readonly OperatorAuthorityLedgerEntry[] | undefined,
    }),
  });
}

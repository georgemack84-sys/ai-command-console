import { buildEscalationDeterminism } from "@/services/escalation-determinism/escalationDeterminismEngine";
import type {
  EscalationDeterminismInput,
  EscalationLedgerEntry,
  EscalationLineageLedger,
} from "@/services/escalation-determinism/escalationStateTypes";
import { buildConstitutionalAuthorityBoundaryFixture } from "@/tests/integration/constitutional-authority-boundary/helpers";
import { buildConstitutionalReplayStabilityFixture } from "@/tests/integration/constitutional-replay-stability/helpers";
import { buildHumanSupremacyEnforcementFixture } from "@/tests/integration/human-supremacy-enforcement/helpers";

export function buildEscalationDeterminismFixture(
  overrides: Partial<EscalationDeterminismInput> = {},
) {
  const constitutionalAuthorityBoundaryResult = overrides.constitutionalAuthorityBoundaryResult
    ?? buildConstitutionalAuthorityBoundaryFixture().result;
  const constitutionalReplayResult = overrides.constitutionalReplayResult
    ?? buildConstitutionalReplayStabilityFixture({
      constitutionalAuthorityBoundaryResult,
    }).result;
  const humanSupremacyResult = overrides.humanSupremacyResult
    ?? buildHumanSupremacyEnforcementFixture({
      constitutionalReplayResult,
    }).result;
  const input: EscalationDeterminismInput = Object.freeze({
    escalationId: "escalation-determinism-1",
    constitutionalAuthorityBoundaryResult,
    constitutionalReplayResult,
    humanSupremacyResult,
    deterministicSeed: "escalation-determinism-seed-1",
    validatorVersionId: "validator-v1",
    createdAt: "2026-05-18T23:00:00.000Z",
    ...overrides,
  });

  return Object.freeze({
    input,
    result: buildEscalationDeterminism({
      ...input,
      existingLineage: overrides.existingLineage as EscalationLineageLedger | undefined,
      existingReplayLedger: overrides.existingReplayLedger as readonly EscalationLedgerEntry[] | undefined,
    }),
  });
}

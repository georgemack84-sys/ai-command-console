import { buildAntiEmergenceContainment } from "@/services/anti-emergence-constitutional-containment/antiEmergenceEngine";
import type {
  AntiEmergenceInput,
  EmergenceLedgerEntry,
  EmergenceLineageLedger,
} from "@/services/anti-emergence-constitutional-containment/antiEmergenceStateTypes";
import { buildConstitutionalAuthorityBoundaryFixture } from "@/tests/integration/constitutional-authority-boundary/helpers";
import { buildConstitutionalReplayStabilityFixture } from "@/tests/integration/constitutional-replay-stability/helpers";
import { buildEscalationDeterminismFixture } from "@/tests/integration/escalation-determinism/helpers";
import { buildHumanSupremacyEnforcementFixture } from "@/tests/integration/human-supremacy-enforcement/helpers";

export function buildAntiEmergenceFixture(
  overrides: Partial<AntiEmergenceInput> = {},
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
  const escalationDeterminismResult = overrides.escalationDeterminismResult
    ?? buildEscalationDeterminismFixture({
      constitutionalAuthorityBoundaryResult,
      constitutionalReplayResult,
      humanSupremacyResult,
    }).result;
  const input: AntiEmergenceInput = Object.freeze({
    containmentId: "anti-emergence-1",
    constitutionalAuthorityBoundaryResult,
    constitutionalReplayResult,
    humanSupremacyResult,
    escalationDeterminismResult,
    deterministicSeed: "anti-emergence-seed-1",
    validatorVersionId: "validator-v1",
    createdAt: "2026-05-19T00:00:00.000Z",
    ...overrides,
  });

  return Object.freeze({
    input,
    result: buildAntiEmergenceContainment({
      ...input,
      existingLineage: overrides.existingLineage as EmergenceLineageLedger | undefined,
      existingReplayLedger: overrides.existingReplayLedger as readonly EmergenceLedgerEntry[] | undefined,
    }),
  });
}

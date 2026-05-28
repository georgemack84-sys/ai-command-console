import { buildConstitutionalAuthorityBoundary } from "@/services/constitutional-authority-boundary/authorityBoundaryEngine";
import type {
  AuthorityBoundaryLedgerEntry,
  AuthorityBoundaryLineageLedger,
  ConstitutionalAuthorityBoundaryInput,
} from "@/services/constitutional-authority-boundary/authorityBoundaryTypes";
import { buildControlledAutonomyReadinessGateFixture } from "@/tests/integration/controlled-autonomy-readiness-gate/helpers";

export function buildConstitutionalAuthorityBoundaryFixture(
  overrides: Partial<ConstitutionalAuthorityBoundaryInput> = {},
) {
  const controlledAutonomyReadinessGateResult = overrides.controlledAutonomyReadinessGateResult
    ?? buildControlledAutonomyReadinessGateFixture().result;
  const input: ConstitutionalAuthorityBoundaryInput = Object.freeze({
    boundaryId: "authority-boundary-1",
    controlledAutonomyReadinessGateResult,
    requestedAuthorityClass: "A2",
    deterministicSeed: "authority-seed-1",
    validatorVersionId: "validator-v1",
    createdAt: "2026-05-18T20:00:00.000Z",
    ...overrides,
  });

  return Object.freeze({
    input,
    result: buildConstitutionalAuthorityBoundary({
      ...input,
      existingLineage: overrides.existingLineage as AuthorityBoundaryLineageLedger | undefined,
      existingReplayLedger: overrides.existingReplayLedger as readonly AuthorityBoundaryLedgerEntry[] | undefined,
    }),
  });
}

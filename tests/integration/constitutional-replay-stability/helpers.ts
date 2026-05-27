import { buildConstitutionalReplayStability } from "@/services/constitutional-replay-stability/constitutionalReplayEngine";
import type {
  ConstitutionalReplayStabilityInput,
  ReplayStabilityLedgerEntry,
  ReplayStabilityLineageLedger,
} from "@/services/constitutional-replay-stability/replayStateTypes";
import { buildConstitutionalAuthorityBoundaryFixture } from "@/tests/integration/constitutional-authority-boundary/helpers";

export function buildConstitutionalReplayStabilityFixture(
  overrides: Partial<ConstitutionalReplayStabilityInput> = {},
) {
  const constitutionalAuthorityBoundaryResult = overrides.constitutionalAuthorityBoundaryResult
    ?? buildConstitutionalAuthorityBoundaryFixture().result;
  const input: ConstitutionalReplayStabilityInput = Object.freeze({
    replayId: "replay-stability-1",
    constitutionalAuthorityBoundaryResult,
    deterministicSeed: "replay-stability-seed-1",
    validatorVersionId: "validator-v1",
    createdAt: "2026-05-18T21:00:00.000Z",
    ...overrides,
  });

  return Object.freeze({
    input,
    result: buildConstitutionalReplayStability({
      ...input,
      existingLineage: overrides.existingLineage as ReplayStabilityLineageLedger | undefined,
      existingReplayLedger: overrides.existingReplayLedger as readonly ReplayStabilityLedgerEntry[] | undefined,
    }),
  });
}

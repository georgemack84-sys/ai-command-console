import { detectFutureAutonomy } from "@/services/future-autonomy-simulation";
import type {
  FutureAutonomyLineage,
  FutureAutonomyReplayLedgerEntry,
  FutureAutonomySimulationInput,
} from "@/types/future-autonomy";
import { buildGovernanceDriftFixture } from "@/tests/integration/governance-drift/helpers";

export function buildFutureAutonomyFixture(
  overrides: Partial<FutureAutonomySimulationInput> = {},
) {
  const governanceDriftResult = overrides.governanceDriftResult
    ?? buildGovernanceDriftFixture().result;
  const input: FutureAutonomySimulationInput = Object.freeze({
    simulationId: "future-autonomy-1",
    governanceDriftResult,
    deterministicSeed: "future-autonomy-seed-1",
    validatorVersionId: "validator-v1",
    createdAt: "2026-05-18T14:00:00.000Z",
    ...overrides,
  });

  return Object.freeze({
    input,
    result: detectFutureAutonomy({
      ...input,
      existingLineage: overrides.existingLineage as FutureAutonomyLineage | undefined,
      existingReplayLedger: overrides.existingReplayLedger as readonly FutureAutonomyReplayLedgerEntry[] | undefined,
    }),
  });
}

import { certifyControlledAutonomyReadinessGate } from "@/services/controlled-autonomy-readiness-gate/controlledAutonomyReadinessGate";
import type {
  ControlledAutonomyGateLedgerEntry,
  ControlledAutonomyGateLineageLedger,
  ControlledAutonomyReadinessGateInput,
} from "@/services/controlled-autonomy-readiness-gate/controlledAutonomyReadinessGate";
import { buildConstitutionalReadinessFixture } from "@/tests/integration/constitutional-readiness/helpers";

export function buildControlledAutonomyReadinessGateFixture(
  overrides: Partial<ControlledAutonomyReadinessGateInput> = {},
) {
  const constitutionalReadinessResult = overrides.constitutionalReadinessResult
    ?? buildConstitutionalReadinessFixture().result;
  const input: ControlledAutonomyReadinessGateInput = Object.freeze({
    gateId: "gate-1",
    constitutionalReadinessResult,
    deterministicSeed: "gate-seed-1",
    validatorVersionId: "validator-v1",
    createdAt: "2026-05-18T19:00:00.000Z",
    ...overrides,
  });

  return Object.freeze({
    input,
    result: certifyControlledAutonomyReadinessGate({
      ...input,
      existingLineage: overrides.existingLineage as ControlledAutonomyGateLineageLedger | undefined,
      existingReplayLedger: overrides.existingReplayLedger as readonly ControlledAutonomyGateLedgerEntry[] | undefined,
    }),
  });
}

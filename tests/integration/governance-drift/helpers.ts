import { detectGovernanceDrift } from "@/services/governance-drift-detection";
import type {
  GovernanceDriftInput,
  GovernanceDriftLineage,
  GovernanceDriftReplayLedgerEntry,
} from "@/types/governance-drift";
import { buildConstitutionalReplayFixture } from "@/tests/integration/constitutional-replay/helpers";

export function buildGovernanceDriftFixture(
  overrides: Partial<GovernanceDriftInput> = {},
) {
  const replayAttackResult = overrides.replayAttackResult ?? buildConstitutionalReplayFixture().result;
  const input: GovernanceDriftInput = Object.freeze({
    driftId: "drift-1",
    replayAttackResult,
    deterministicSeed: "drift-seed-1",
    validatorVersionId: "validator-v1",
    createdAt: "2026-05-18T13:00:00.000Z",
    ...overrides,
  });

  return Object.freeze({
    input,
    result: detectGovernanceDrift({
      ...input,
      existingLineage: overrides.existingLineage as GovernanceDriftLineage | undefined,
      existingReplayLedger: overrides.existingReplayLedger as readonly GovernanceDriftReplayLedgerEntry[] | undefined,
    }),
  });
}

import { simulateConstitutionalReplayAttack } from "@/services/constitutional-replay-attack";
import type {
  ConstitutionalReplayAttackInput,
  ConstitutionalReplayLedgerEntry,
  ConstitutionalReplayLineage,
} from "@/types/constitutional-replay";
import { buildApprovalConflictFixture } from "@/tests/integration/approval-conflict/helpers";

export function buildConstitutionalReplayFixture(
  overrides: Partial<ConstitutionalReplayAttackInput> = {},
) {
  const approvalConflictResult = overrides.approvalConflictResult ?? buildApprovalConflictFixture().result;
  const input: ConstitutionalReplayAttackInput = Object.freeze({
    replayAttackId: "replay-attack-1",
    scenarioCategory: "VALIDATOR_SUBSTITUTION",
    approvalConflictResult,
    deterministicSeed: "replay-seed-1",
    validatorVersionId: "validator-v1",
    createdAt: "2026-05-18T12:00:00.000Z",
    ...overrides,
  });

  return Object.freeze({
    input,
    result: simulateConstitutionalReplayAttack({
      ...input,
      existingLineage: overrides.existingLineage as ConstitutionalReplayLineage | undefined,
      existingReplayLedger: overrides.existingReplayLedger as readonly ConstitutionalReplayLedgerEntry[] | undefined,
    }),
  });
}

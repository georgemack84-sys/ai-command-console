import type { ConstitutionalReplayAttackInput, ConstitutionalReplayError } from "@/types/constitutional-replay";

export function validateConstitutionalReplay(input: ConstitutionalReplayAttackInput): readonly ConstitutionalReplayError[] {
  const errors: ConstitutionalReplayError[] = [];
  if (!input.approvalConflictResult.record.replaySafe) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_REPLAY_LINEAGE_BREAK",
      message: "Upstream approval conflict result was not replay-safe.",
      path: "approvalConflictResult.record.replaySafe",
    }));
  }
  if (!input.approvalConflictResult.record.governanceSnapshotId) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_REPLAY_GOVERNANCE_DRIFT",
      message: "Governance snapshot linkage is required for constitutional replay.",
      path: "approvalConflictResult.record.governanceSnapshotId",
    }));
  }
  return Object.freeze(errors);
}

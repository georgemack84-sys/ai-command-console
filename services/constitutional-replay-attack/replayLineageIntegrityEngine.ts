import type { ConstitutionalReplayAttackInput, ConstitutionalReplayError } from "@/types/constitutional-replay";

export function validateReplayLineageIntegrity(input: ConstitutionalReplayAttackInput): readonly ConstitutionalReplayError[] {
  const errors: ConstitutionalReplayError[] = [];
  if (!input.approvalConflictResult.lineage.entries.length) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_REPLAY_LINEAGE_BREAK",
      message: "Approval conflict lineage must be present for replay reconstruction.",
      path: "approvalConflictResult.lineage.entries",
    }));
  }
  if (!input.approvalConflictResult.replayLedger.length) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_REPLAY_LINEAGE_BREAK",
      message: "Replay ledger must be append-only and non-empty.",
      path: "approvalConflictResult.replayLedger",
    }));
  }
  return Object.freeze(errors);
}

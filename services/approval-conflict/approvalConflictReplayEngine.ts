import type { ApprovalConflictStressInput } from "@/types/approval-conflict";
import { hashApprovalConflictValue } from "./deterministicApprovalConflictHasher";

export function buildApprovalConflictReplay(input: ApprovalConflictStressInput) {
  const replayState = input.recommendationResult.record.replaySafe ? "historical" : "disputed";
  return Object.freeze({
    replayId: hashApprovalConflictValue("replay-id", {
      conflictId: input.conflictId,
      recommendationId: input.recommendationResult.record.recommendationId,
    }),
    replayDeterministic: input.recommendationResult.record.replaySafe,
    replayState,
    replayLedgerId: input.recommendationResult.replayLedger[0]?.ledgerId
      ?? hashApprovalConflictValue("empty-ledger", input.conflictId),
  });
}

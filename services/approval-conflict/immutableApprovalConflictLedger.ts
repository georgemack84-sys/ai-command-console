import type { ApprovalConflictReplayLedgerEntry } from "@/types/approval-conflict";
import { appendApprovalConflictReplayLedger } from "@/services/approval-conflict-lineage/approvalConflictReplayLineage";

export function appendImmutableApprovalConflictLedger(input: {
  existing?: readonly ApprovalConflictReplayLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly ApprovalConflictReplayLedgerEntry[] {
  return appendApprovalConflictReplayLedger(input);
}

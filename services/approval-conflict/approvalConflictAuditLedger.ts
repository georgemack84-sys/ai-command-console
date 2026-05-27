import type { ApprovalConflictReplayLedgerEntry } from "@/types/approval-conflict";
import { appendImmutableApprovalConflictLedger } from "./immutableApprovalConflictLedger";

export function appendApprovalConflictAuditLedger(input: {
  existing?: readonly ApprovalConflictReplayLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly ApprovalConflictReplayLedgerEntry[] {
  return appendImmutableApprovalConflictLedger(input);
}

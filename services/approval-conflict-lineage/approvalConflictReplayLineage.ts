import type { ApprovalConflictReplayLedgerEntry } from "@/types/approval-conflict";
import { appendImmutableApprovalConflictLineageLedger } from "./immutableApprovalConflictLineageLedger";

export function appendApprovalConflictReplayLedger(input: {
  existing?: readonly ApprovalConflictReplayLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly ApprovalConflictReplayLedgerEntry[] {
  return appendImmutableApprovalConflictLineageLedger(input);
}

import type { ApprovalConflictReplayLedgerEntry } from "@/types/approval-conflict";
import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";

export function appendImmutableApprovalConflictLineageLedger(input: {
  existing?: readonly ApprovalConflictReplayLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly ApprovalConflictReplayLedgerEntry[] {
  const previousHash = input.existing && input.existing.length > 0
    ? input.existing[input.existing.length - 1]?.entryHash ?? null
    : null;
  const entry = appendImmutableLedgerEntry({
    payload: input.payload,
    previousHash,
    scope: input.scope,
  });
  return Object.freeze([...(input.existing ?? []), Object.freeze(entry)]);
}

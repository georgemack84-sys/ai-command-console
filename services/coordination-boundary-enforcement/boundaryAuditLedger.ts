import type { BoundaryReplayLedgerEntry } from "@/types/coordination-boundary-enforcement";
import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";

export function appendBoundaryAuditLedger(input: {
  existing?: readonly BoundaryReplayLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly BoundaryReplayLedgerEntry[] {
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

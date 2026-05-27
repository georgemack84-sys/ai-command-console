import type { GovernanceDriftReplayLedgerEntry } from "@/types/governance-drift";
import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";

export function appendImmutableGovernanceDriftLineageLedger(input: {
  existing?: readonly GovernanceDriftReplayLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly GovernanceDriftReplayLedgerEntry[] {
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

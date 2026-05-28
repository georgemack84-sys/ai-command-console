import type { OverrideReplayLedgerEntry } from "@/types/human-coordination-override";
import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";

export function appendOverrideReplayLedger(input: {
  existing?: readonly OverrideReplayLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly OverrideReplayLedgerEntry[] {
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

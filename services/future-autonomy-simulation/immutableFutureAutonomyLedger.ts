import type { FutureAutonomyReplayLedgerEntry } from "@/types/future-autonomy";
import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";

export function appendImmutableFutureAutonomyLedger(input: {
  existing?: readonly FutureAutonomyReplayLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly FutureAutonomyReplayLedgerEntry[] {
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

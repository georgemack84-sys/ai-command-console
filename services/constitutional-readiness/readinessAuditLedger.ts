import type { ReadinessLedgerEntry } from "@/types/constitutional-readiness";
import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";

export function appendReadinessAuditLedger(input: {
  existing?: readonly ReadinessLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly ReadinessLedgerEntry[] {
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

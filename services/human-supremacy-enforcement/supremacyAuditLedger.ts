import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { SupremacyLedgerEntry } from "./supremacyStateTypes";

export function appendSupremacyAuditLedger(input: {
  existing?: readonly SupremacyLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly SupremacyLedgerEntry[] {
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

import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { ConstitutionalTransitionLedgerEntry } from "./types/constitutionalTransitionTypes";

export function appendTransitionAuditEntry(input: {
  existing?: readonly ConstitutionalTransitionLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly ConstitutionalTransitionLedgerEntry[] {
  const previousHash = input.existing?.at(-1)?.entryHash ?? null;
  const entry = appendImmutableLedgerEntry({
    payload: input.payload,
    previousHash,
    scope: input.scope,
  });
  return Object.freeze([...(input.existing ?? []), entry]);
}

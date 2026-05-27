import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type {
  EscalationLedgerEntry,
  EscalationLineageEntry,
  EscalationLineageLedger,
} from "./escalationStateTypes";
import { hashEscalationLineage } from "./escalationLineageHasher";

export function appendEscalationLineage(input: {
  existing?: EscalationLineageLedger;
  entry: EscalationLineageEntry;
}): EscalationLineageLedger {
  const entries = Object.freeze([...(input.existing?.entries ?? []), Object.freeze(input.entry)]);
  return Object.freeze({
    entries,
    lineageHash: hashEscalationLineage("ledger", entries),
  });
}

export function appendEscalationLedger(input: {
  existing?: readonly EscalationLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly EscalationLedgerEntry[] {
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

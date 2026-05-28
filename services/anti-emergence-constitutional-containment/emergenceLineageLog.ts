import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type {
  EmergenceLedgerEntry,
  EmergenceLineageEntry,
  EmergenceLineageLedger,
} from "./antiEmergenceStateTypes";
import { hashEmergenceLineage } from "./emergenceLineageHasher";

export function appendEmergenceLineage(input: {
  existing?: EmergenceLineageLedger;
  entry: EmergenceLineageEntry;
}): EmergenceLineageLedger {
  const entries = Object.freeze([...(input.existing?.entries ?? []), Object.freeze(input.entry)]);
  return Object.freeze({
    entries,
    lineageHash: hashEmergenceLineage("ledger", entries),
  });
}

export function appendEmergenceLedger(input: {
  existing?: readonly EmergenceLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly EmergenceLedgerEntry[] {
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

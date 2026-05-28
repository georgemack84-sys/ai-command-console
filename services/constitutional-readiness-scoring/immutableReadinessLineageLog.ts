import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type {
  ReadinessLedgerEntry,
  ReadinessLineageEntry,
  ReadinessLineageLedger,
} from "./readinessStateTypes";
import { hashReadinessValue } from "./readinessTraceHasher";

export function appendReadinessLineage(input: {
  existing?: ReadinessLineageLedger;
  entry: ReadinessLineageEntry;
}): ReadinessLineageLedger {
  const entries = Object.freeze([
    ...(input.existing?.entries ?? []),
    input.entry,
  ]);

  return Object.freeze({
    entries,
    lineageHash: hashReadinessValue("constitutional-readiness-lineage", entries),
  });
}

export function appendReadinessLedger(input: {
  existing?: readonly ReadinessLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly ReadinessLedgerEntry[] {
  const previousHash = input.existing?.at(-1)?.entryHash ?? null;
  const nextEntry = appendImmutableLedgerEntry({
    payload: input.payload,
    previousHash,
    scope: input.scope,
  });

  return Object.freeze([...(input.existing ?? []), nextEntry]);
}

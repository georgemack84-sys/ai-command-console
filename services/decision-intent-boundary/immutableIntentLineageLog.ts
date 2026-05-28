import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type {
  IntentLedgerEntry,
  IntentLineageEntry,
  IntentLineageLedger,
} from "./decisionIntentStateTypes";
import { hashIntentValue } from "./intentTraceHasher";

export function appendIntentLineage(input: {
  existing?: IntentLineageLedger;
  entry: IntentLineageEntry;
}): IntentLineageLedger {
  const entries = Object.freeze([...(input.existing?.entries ?? []), input.entry]);
  return Object.freeze({
    entries,
    lineageHash: hashIntentValue("decision-intent-lineage", entries),
  });
}

export function appendIntentLedger(input: {
  existing?: readonly IntentLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly IntentLedgerEntry[] {
  const previousHash = input.existing?.at(-1)?.entryHash ?? null;
  const entry = appendImmutableLedgerEntry({
    payload: input.payload,
    previousHash,
    scope: input.scope,
  });
  return Object.freeze([...(input.existing ?? []), entry]);
}

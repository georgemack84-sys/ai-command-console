import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type {
  TelemetryLedgerEntry,
  TelemetryLineageEntry,
  TelemetryLineageLedger,
} from "./telemetryStateTypes";
import { hashConstitutionalTelemetryValue } from "./telemetryHashingEngine";

export function appendTelemetryLineage(input: {
  existing?: TelemetryLineageLedger;
  entry: TelemetryLineageEntry;
}): TelemetryLineageLedger {
  const entries = Object.freeze([...(input.existing?.entries ?? []), Object.freeze(input.entry)]);
  return Object.freeze({
    entries,
    lineageHash: hashConstitutionalTelemetryValue("constitutional-telemetry-lineage", entries),
  });
}

export function appendTelemetryLedger(input: {
  existing?: readonly TelemetryLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly TelemetryLedgerEntry[] {
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

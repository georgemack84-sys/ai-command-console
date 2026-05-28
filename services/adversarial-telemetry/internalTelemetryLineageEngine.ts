import type { TelemetryLineageEntry, TelemetryLineageLedger } from "@/types/adversarial-telemetry";
import { hashTelemetryValue } from "./telemetryHashEngine";

export function appendInternalTelemetryLineage(input: {
  existing?: TelemetryLineageLedger;
  entry: TelemetryLineageEntry;
}): TelemetryLineageLedger {
  const entries = Object.freeze([
    ...(input.existing?.entries ?? []),
    input.entry,
  ].sort((left, right) => {
    if (left.createdAt !== right.createdAt) {
      return left.createdAt.localeCompare(right.createdAt);
    }
    return left.entryId.localeCompare(right.entryId);
  }));
  return Object.freeze({
    ledgerId: input.existing?.ledgerId ?? hashTelemetryValue("telemetry-lineage-ledger-id", entries[0]?.entryId ?? "empty"),
    entries,
    lineageHash: hashTelemetryValue("telemetry-lineage", entries),
  });
}

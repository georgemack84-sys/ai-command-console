import type { TelemetryLedgerEntry } from "@/types/adversarial-telemetry";
import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";

export function appendImmutableTelemetryLedger(input: {
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

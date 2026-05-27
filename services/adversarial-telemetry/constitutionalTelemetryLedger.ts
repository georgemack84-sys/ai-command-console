import type { TelemetryLedgerEntry } from "@/types/adversarial-telemetry";
import { appendImmutableTelemetryLedger } from "./immutableTelemetryLedger";

export function appendConstitutionalTelemetryLedger(input: {
  existing?: readonly TelemetryLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly TelemetryLedgerEntry[] {
  return appendImmutableTelemetryLedger(input);
}

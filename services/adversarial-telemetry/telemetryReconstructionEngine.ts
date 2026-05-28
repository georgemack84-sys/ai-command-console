import type { ConstitutionalTelemetryEvent, ConstitutionalTelemetryInput } from "@/types/adversarial-telemetry";

export function reconstructTelemetryEvents(input: {
  telemetryInput: ConstitutionalTelemetryInput;
  events: readonly ConstitutionalTelemetryEvent[];
}): readonly ConstitutionalTelemetryEvent[] {
  return Object.freeze([...input.events].sort((left, right) =>
    left.forensicHash.localeCompare(right.forensicHash),
  ));
}

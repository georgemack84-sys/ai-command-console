import type { ConstitutionalTelemetryEvent, TelemetrySeverity } from "@/types/adversarial-telemetry";

const ORDER: Record<TelemetrySeverity, number> = {
  low: 0,
  moderate: 1,
  high: 2,
  critical: 3,
};

export function classifyTelemetryRisk(events: readonly ConstitutionalTelemetryEvent[]): TelemetrySeverity {
  return events.reduce<TelemetrySeverity>((current, event) =>
    ORDER[event.severity] > ORDER[current] ? event.severity : current, "low");
}

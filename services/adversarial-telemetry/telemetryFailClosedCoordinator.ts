import type { TelemetryError, TelemetrySeverity } from "@/types/adversarial-telemetry";

export function resolveTelemetryState(input: {
  errors: readonly TelemetryError[];
  severity: TelemetrySeverity;
  inheritedFailClosed: boolean;
}): "stable" | "elevated" | "frozen" | "blocked" | "disputed" {
  if (input.inheritedFailClosed) {
    return "blocked";
  }
  if (input.errors.some((item) =>
    item.code === "ADVERSARIAL_TELEMETRY_ISOLATION_VIOLATION"
    || item.code === "ADVERSARIAL_TELEMETRY_RUNTIME_CONTAMINATION"
    || item.code === "ADVERSARIAL_TELEMETRY_PRIVILEGE_ESCALATION"
    || item.code === "ADVERSARIAL_TELEMETRY_SYNTHETIC_AUTHORITY",
  )) {
    return "blocked";
  }
  if (input.errors.length > 0) {
    return input.severity === "critical" ? "frozen" : "disputed";
  }
  if (input.severity === "high" || input.severity === "moderate") {
    return "elevated";
  }
  return "stable";
}

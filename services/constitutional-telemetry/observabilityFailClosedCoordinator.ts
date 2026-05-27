import type {
  ConstitutionalTelemetryError,
  ConstitutionalTelemetryState,
  TelemetrySeverity,
} from "./telemetryStateTypes";

export function resolveTelemetryState(input: {
  errors: readonly ConstitutionalTelemetryError[];
  severity: TelemetrySeverity;
  inheritedFailClosed: boolean;
}): ConstitutionalTelemetryState {
  if (input.inheritedFailClosed) {
    return "invalid";
  }
  if (input.errors.some((error) =>
    error.code === "CONSTITUTIONAL_TELEMETRY_AUTHORITY_CROSSOVER"
    || error.code === "CONSTITUTIONAL_TELEMETRY_ISOLATION_VIOLATION"
    || error.code === "CONSTITUTIONAL_TELEMETRY_BOUNDARY_VIOLATION")) {
    return "invalid";
  }
  if (input.errors.some((error) =>
    error.code === "CONSTITUTIONAL_TELEMETRY_GOVERNANCE_DETACHED"
    || error.code === "CONSTITUTIONAL_TELEMETRY_HIDDEN_ORCHESTRATION"
    || error.code === "CONSTITUTIONAL_TELEMETRY_RECURSIVE_COORDINATION")) {
    return "frozen";
  }
  if (input.errors.length > 0) {
    return "disputed";
  }
  if (input.severity === "high" || input.severity === "moderate") {
    return "elevated";
  }
  return "stable";
}

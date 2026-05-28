import type {
  ConstitutionalTelemetryError,
  ConstitutionalTelemetryInput,
  TelemetryEvent,
} from "./telemetryStateTypes";
import { hashConstitutionalTelemetryValue } from "./telemetryHashingEngine";

export function detectCoordinationDrift(
  input: ConstitutionalTelemetryInput,
): Readonly<{
  event: TelemetryEvent;
  errors: readonly ConstitutionalTelemetryError[];
}> {
  const driftDetected = input.antiEmergenceResult.signals.some((signal) =>
    signal.triggered
      && (signal.domain === "recursive_coordination" || signal.domain === "fanout_expansion"));
  const errors: ConstitutionalTelemetryError[] = [];
  if (driftDetected) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_TELEMETRY_COORDINATION_DRIFT",
      message: "Telemetry detected recursive coordination or hidden fanout drift.",
      path: "antiEmergenceResult.signals",
    }));
  }
  if (input.runtimeAdmissibilityResult.errors.some((error) => error.code === "RUNTIME_ADMISSIBILITY_RECURSIVE_COORDINATION")) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_TELEMETRY_RECURSIVE_COORDINATION",
      message: "Telemetry detected recursive coordination in runtime admissibility evidence.",
      path: "runtimeAdmissibilityResult.errors",
    }));
  }
  return Object.freeze({
    event: Object.freeze({
      telemetryId: input.telemetryId,
      domain: "coordination_drift",
      triggered: errors.length > 0,
      severity: errors.length > 0 ? "critical" : "none",
      reason: errors.length > 0 ? "Coordination drift crossed constitutional anti-emergence boundaries." : "Coordination remained constitutionally bounded.",
      deterministicHash: hashConstitutionalTelemetryValue("constitutional-telemetry-coordination-event", {
        telemetryId: input.telemetryId,
        triggered: errors.length > 0,
      }),
    }),
    errors: Object.freeze(errors),
  });
}

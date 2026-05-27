import type {
  ConstitutionalTelemetryError,
  ConstitutionalTelemetryInput,
  TelemetryEvent,
} from "./telemetryStateTypes";
import { hashConstitutionalTelemetryValue } from "./telemetryHashingEngine";

export function monitorContainmentPressure(
  input: ConstitutionalTelemetryInput,
): Readonly<{
  event: TelemetryEvent;
  errors: readonly ConstitutionalTelemetryError[];
}> {
  const triggered = input.antiEmergenceResult.record.classification !== "contained"
    || input.runtimeAdmissibilityResult.record.classification !== "admissible";
  const errors = triggered
    ? [Object.freeze({
      code: "CONSTITUTIONAL_TELEMETRY_CONTAINMENT_DRIFT" as const,
      message: "Telemetry detected elevated containment pressure or inadmissible runtime state.",
      path: "antiEmergenceResult.record.classification",
    })]
    : [];
  return Object.freeze({
    event: Object.freeze({
      telemetryId: input.telemetryId,
      domain: "containment_pressure",
      triggered,
      severity: triggered ? "high" : "none",
      reason: triggered ? "Containment pressure increased and runtime admissibility no longer remained clean." : "Containment pressure remained bounded and observational-only.",
      deterministicHash: hashConstitutionalTelemetryValue("constitutional-telemetry-containment-event", {
        telemetryId: input.telemetryId,
        triggered,
      }),
    }),
    errors: Object.freeze(errors),
  });
}

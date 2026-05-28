import type {
  ConstitutionalTelemetryError,
  ConstitutionalTelemetryInput,
  TelemetryEvent,
} from "./telemetryStateTypes";
import { hashConstitutionalTelemetryValue } from "./telemetryHashingEngine";

export function analyzeAuthorityPressure(
  input: ConstitutionalTelemetryInput,
): Readonly<{
  event: TelemetryEvent;
  errors: readonly ConstitutionalTelemetryError[];
}> {
  const triggered = input.runtimeAdmissibilityResult.errors.some((error) =>
    error.code === "RUNTIME_ADMISSIBILITY_AUTHORITY_EXPANSION");
  const errors = triggered
    ? [Object.freeze({
      code: "CONSTITUTIONAL_TELEMETRY_AUTHORITY_PRESSURE" as const,
      message: "Telemetry detected authority pressure against constitutional ceilings.",
      path: "runtimeAdmissibilityResult.errors",
    })]
    : [];
  return Object.freeze({
    event: Object.freeze({
      telemetryId: input.telemetryId,
      domain: "authority_pressure",
      triggered,
      severity: triggered ? "critical" : "none",
      reason: triggered ? "Authority pressure exceeded constitutional isolation expectations." : "Authority remained constitutionally bounded.",
      deterministicHash: hashConstitutionalTelemetryValue("constitutional-telemetry-authority-event", {
        telemetryId: input.telemetryId,
        triggered,
      }),
    }),
    errors: Object.freeze(errors),
  });
}

import type {
  ConstitutionalTelemetryError,
  ConstitutionalTelemetryInput,
  TelemetryEvent,
} from "./telemetryStateTypes";
import { hashConstitutionalTelemetryValue } from "./telemetryHashingEngine";

export function trackOverridePropagation(
  input: ConstitutionalTelemetryInput,
): Readonly<{
  event: TelemetryEvent;
  errors: readonly ConstitutionalTelemetryError[];
}> {
  const triggered = input.humanSupremacyResult.overridePropagation.propagationState !== "immediate"
    || !input.humanSupremacyResult.overridePropagation.globallyPropagated;
  const errors = triggered
    ? [Object.freeze({
      code: "CONSTITUTIONAL_TELEMETRY_OVERRIDE_PROPAGATION_FAILURE" as const,
      message: "Telemetry detected suppressed or partial override propagation.",
      path: "humanSupremacyResult.overridePropagation.propagationState",
    })]
    : [];
  return Object.freeze({
    event: Object.freeze({
      telemetryId: input.telemetryId,
      domain: "override_propagation",
      triggered,
      severity: triggered ? "critical" : "none",
      reason: triggered ? "Operator supremacy failed to propagate immediately and globally." : "Operator supremacy remained immediately visible and globally propagated.",
      deterministicHash: hashConstitutionalTelemetryValue("constitutional-telemetry-override-event", {
        telemetryId: input.telemetryId,
        triggered,
      }),
    }),
    errors: Object.freeze(errors),
  });
}

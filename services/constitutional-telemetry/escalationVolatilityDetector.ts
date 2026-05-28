import type {
  ConstitutionalTelemetryError,
  ConstitutionalTelemetryInput,
  TelemetryEvent,
} from "./telemetryStateTypes";
import { hashConstitutionalTelemetryValue } from "./telemetryHashingEngine";

export function detectEscalationVolatility(
  input: ConstitutionalTelemetryInput,
): Readonly<{
  event: TelemetryEvent;
  errors: readonly ConstitutionalTelemetryError[];
}> {
  const triggered = input.escalationDeterminismResult.record.oversightState !== "stable";
  const errors = triggered
    ? [Object.freeze({
      code: "CONSTITUTIONAL_TELEMETRY_ESCALATION_VOLATILITY" as const,
      message: "Telemetry detected escalation volatility or amplified oversight pressure.",
      path: "escalationDeterminismResult.record.oversightState",
    })]
    : [];
  return Object.freeze({
    event: Object.freeze({
      telemetryId: input.telemetryId,
      domain: "escalation_volatility",
      triggered,
      severity: triggered ? "high" : "none",
      reason: triggered ? "Escalation lineage exhibited unstable or non-stable oversight transitions." : "Escalation lineage remained stable.",
      deterministicHash: hashConstitutionalTelemetryValue("constitutional-telemetry-escalation-event", {
        telemetryId: input.telemetryId,
        triggered,
      }),
    }),
    errors: Object.freeze(errors),
  });
}

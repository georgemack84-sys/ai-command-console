import type {
  ConstitutionalTelemetryError,
  ConstitutionalTelemetryInput,
} from "./telemetryStateTypes";

export function normalizeTelemetryMetadata(
  metadata: Readonly<Record<string, unknown>> | undefined,
): string {
  return JSON.stringify(metadata ?? {}).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function validateConstitutionalTelemetryInput(
  input: ConstitutionalTelemetryInput,
): readonly ConstitutionalTelemetryError[] {
  const errors: ConstitutionalTelemetryError[] = [];
  if (!input.constitutionalReplayResult.derivedOnly
    || !input.humanSupremacyResult.derivedOnly
    || !input.escalationDeterminismResult.derivedOnly
    || !input.antiEmergenceResult.derivedOnly
    || !input.runtimeAdmissibilityResult.derivedOnly) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_TELEMETRY_VALIDATOR_MISMATCH",
      message: "Constitutional telemetry requires derived-only upstream constitutional results.",
      path: "constitutionalReplayResult.derivedOnly",
    }));
  }
  return Object.freeze(errors);
}

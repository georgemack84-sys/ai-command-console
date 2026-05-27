import type { ConstitutionalTelemetryInput, TelemetryError } from "@/types/adversarial-telemetry";

export function validateTelemetryContainment(input: ConstitutionalTelemetryInput): readonly TelemetryError[] {
  const errors: TelemetryError[] = [];
  if (input.constitutionalAuditEpisodeResult.record.failClosed) {
    errors.push(Object.freeze({
      code: "ADVERSARIAL_TELEMETRY_FAIL_CLOSED",
      message: "Inherited fail-closed state blocks permissive telemetry interpretation.",
      path: "constitutionalAuditEpisodeResult.record.failClosed",
    }));
  }
  return Object.freeze(errors);
}

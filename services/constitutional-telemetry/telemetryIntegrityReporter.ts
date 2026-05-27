import type {
  ConstitutionalTelemetryError,
  ConstitutionalTelemetryState,
  TelemetryIntegrityReport,
} from "./telemetryStateTypes";
import { hashConstitutionalTelemetryValue } from "./telemetryHashingEngine";

export function buildTelemetryIntegrityReport(input: {
  telemetryId: string;
  telemetryState: ConstitutionalTelemetryState;
  errors: readonly ConstitutionalTelemetryError[];
  deterministic: boolean;
}): TelemetryIntegrityReport {
  const reasons = Object.freeze(input.errors.map((error) => error.code).sort());
  return Object.freeze({
    reportId: hashConstitutionalTelemetryValue("constitutional-telemetry-report-id", input.telemetryId),
    telemetryId: input.telemetryId,
    telemetryState: input.telemetryState,
    failClosed: input.telemetryState !== "stable",
    deterministic: input.deterministic,
    reasons,
    reportHash: hashConstitutionalTelemetryValue("constitutional-telemetry-report", {
      telemetryId: input.telemetryId,
      telemetryState: input.telemetryState,
      reasons,
      deterministic: input.deterministic,
    }),
  });
}

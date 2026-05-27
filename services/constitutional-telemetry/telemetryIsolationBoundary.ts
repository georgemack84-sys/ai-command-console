import type {
  ConstitutionalTelemetryError,
  ConstitutionalTelemetryInput,
} from "./telemetryStateTypes";
import { normalizeTelemetryMetadata } from "./telemetrySchemas";

export function validateTelemetryIsolationBoundary(
  input: ConstitutionalTelemetryInput,
): readonly ConstitutionalTelemetryError[] {
  const metadata = normalizeTelemetryMetadata(input.metadata);
  const isolated = ![
    "execution",
    "orchestration",
    "scheduler",
    "taskqueue",
    "runtimecontroller",
    "remediation",
  ].some((marker) => metadata.includes(marker));
  if (isolated) {
    return Object.freeze([]);
  }
  return Object.freeze([Object.freeze({
    code: "CONSTITUTIONAL_TELEMETRY_ISOLATION_VIOLATION",
    message: "Telemetry must remain isolated from execution, orchestration, scheduling, and remediation systems.",
    path: "metadata",
  })]);
}

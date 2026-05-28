import type {
  ConstitutionalTelemetryError,
  ConstitutionalTelemetryInput,
} from "./telemetryStateTypes";
import { normalizeTelemetryMetadata } from "./telemetrySchemas";

export function validateTelemetryAuthorityFirewall(
  input: ConstitutionalTelemetryInput,
): readonly ConstitutionalTelemetryError[] {
  const metadata = normalizeTelemetryMetadata(input.metadata);
  const crossed = [
    "authoritygrant",
    "authorityexpansion",
    "telemetrytriggeredaction",
    "runtimeinput",
    "selfauthorization",
  ].some((marker) => metadata.includes(marker));
  if (!crossed) {
    return Object.freeze([]);
  }
  return Object.freeze([Object.freeze({
    code: "CONSTITUTIONAL_TELEMETRY_AUTHORITY_CROSSOVER",
    message: "Telemetry attempted to cross from observability into runtime or authority semantics.",
    path: "metadata",
  })]);
}

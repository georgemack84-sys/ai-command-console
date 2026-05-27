import type {
  ConstitutionalTelemetryError,
  ConstitutionalTelemetryInput,
} from "./telemetryStateTypes";

export function validateTelemetryContainment(
  input: ConstitutionalTelemetryInput,
): readonly ConstitutionalTelemetryError[] {
  const errors: ConstitutionalTelemetryError[] = [];
  if (input.runtimeAdmissibilityResult.errors.some((error) => error.code === "RUNTIME_ADMISSIBILITY_HIDDEN_ORCHESTRATION")) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_TELEMETRY_HIDDEN_ORCHESTRATION",
      message: "Telemetry detected hidden orchestration in runtime admissibility evidence.",
      path: "runtimeAdmissibilityResult.errors",
    }));
  }
  if (input.runtimeAdmissibilityResult.errors.some((error) => error.code === "RUNTIME_ADMISSIBILITY_TOPOLOGY_MUTATION")) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_TELEMETRY_TOPOLOGY_MUTATION",
      message: "Telemetry detected topology mutation across constitutional evidence.",
      path: "runtimeAdmissibilityResult.errors",
    }));
  }
  return Object.freeze(errors);
}

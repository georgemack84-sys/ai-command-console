import type {
  ConstitutionalReadinessError,
  ConstitutionalReadinessInput,
} from "./readinessStateTypes";

export function validateReadinessContainment(
  input: ConstitutionalReadinessInput,
): readonly ConstitutionalReadinessError[] {
  const errors: ConstitutionalReadinessError[] = [];

  if (
    input.antiEmergenceResult.record.classification !== "contained"
    || input.antiEmergenceResult.containmentState.freezeRequired
    || input.runtimeAdmissibilityResult.record.classification !== "admissible"
  ) {
    errors.push({
      code: "CONSTITUTIONAL_READINESS_CONTAINMENT_WEAKENED",
      message: "Containment validation failed closed.",
      path: "antiEmergenceResult.containmentState",
    });
  }

  if (
    input.constitutionalRuntimeSimulationResult.containmentState.authorityIncreaseDetected
    || input.constitutionalRuntimeSimulationResult.containmentState.oversightIncreased === false
  ) {
    errors.push({
      code: "CONSTITUTIONAL_READINESS_UNCERTAINTY_UNDERWEIGHTED",
      message: "Containment pressure did not increase oversight strongly enough.",
      path: "constitutionalRuntimeSimulationResult.containmentState",
    });
  }

  return Object.freeze(errors);
}

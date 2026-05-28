import type {
  ConstitutionalRuntimeSimulationError,
  ConstitutionalRuntimeSimulationInput,
} from "./simulationStateTypes";

export function normalizeSimulationMetadata(
  metadata: Readonly<Record<string, unknown>> | undefined,
): string {
  return JSON.stringify(metadata ?? {}).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function validateSimulationInput(
  input: ConstitutionalRuntimeSimulationInput,
): readonly ConstitutionalRuntimeSimulationError[] {
  const errors: ConstitutionalRuntimeSimulationError[] = [];
  if (!input.constitutionalAuthorityBoundaryResult.derivedOnly
    || !input.constitutionalReplayResult.derivedOnly
    || !input.humanSupremacyResult.derivedOnly
    || !input.escalationDeterminismResult.derivedOnly
    || !input.antiEmergenceResult.derivedOnly
    || !input.runtimeAdmissibilityResult.derivedOnly
    || !input.constitutionalTelemetryResult.derivedOnly) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_RUNTIME_SIMULATION_VALIDATOR_MISMATCH",
      message: "Runtime simulation requires derived-only upstream constitutional results.",
      path: "constitutionalReplayResult.derivedOnly",
    }));
  }
  return Object.freeze(errors);
}

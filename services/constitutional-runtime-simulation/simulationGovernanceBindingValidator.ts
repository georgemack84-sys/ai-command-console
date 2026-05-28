import type {
  ConstitutionalRuntimeSimulationError,
  ConstitutionalRuntimeSimulationInput,
  SimulationGovernanceBinding,
} from "./simulationStateTypes";
import { hashSimulationValue } from "./simulationTraceHasher";

export function validateSimulationGovernanceBinding(
  input: ConstitutionalRuntimeSimulationInput,
): Readonly<{
  governanceBinding: SimulationGovernanceBinding;
  errors: readonly ConstitutionalRuntimeSimulationError[];
}> {
  const governanceBound = input.runtimeAdmissibilityResult.governanceBinding.governanceBound
    && input.constitutionalTelemetryResult.record.governanceSnapshotId
      === input.constitutionalReplayResult.record.governanceSnapshotId;
  const supremacyBound = input.humanSupremacyResult.record.governanceBound;
  const containmentBound = input.antiEmergenceResult.record.governanceBound;
  const escalationBound = input.escalationDeterminismResult.record.governanceBound;
  const errors = governanceBound && supremacyBound && containmentBound && escalationBound
    ? []
    : [Object.freeze({
      code: "CONSTITUTIONAL_RUNTIME_SIMULATION_GOVERNANCE_MISMATCH" as const,
      message: "Simulation requires immutable governance, supremacy, containment, and escalation bindings.",
      path: "runtimeAdmissibilityResult.governanceBinding.governanceBound",
    })];
  return Object.freeze({
    governanceBinding: Object.freeze({
      bindingId: hashSimulationValue("constitutional-runtime-simulation-governance-binding-id", input.simulationId),
      governanceBound,
      supremacyBound,
      containmentBound,
      escalationBound,
      deterministicHash: hashSimulationValue("constitutional-runtime-simulation-governance-binding", {
        governanceBound,
        supremacyBound,
        containmentBound,
        escalationBound,
      }),
    }),
    errors: Object.freeze(errors),
  });
}

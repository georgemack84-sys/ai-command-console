import type {
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
} from "./certificationStateTypes";

export function validateCertificationOrchestrationDrift(
  input: ConstitutionalCertificationInput,
): readonly ConstitutionalCertificationError[] {
  const drift =
    input.constitutionalTelemetryResult.events.some((event) => event.domain === "coordination_drift" && event.triggered)
    || input.constitutionalRuntimeSimulationResult.signals.some((signal) => signal.domain === "coordination_stress" && signal.triggered);
  return drift ? Object.freeze([{
    code: "CONSTITUTIONAL_CERTIFICATION_HIDDEN_EXECUTION",
    message: "Orchestration drift threatens constitutional containment.",
    path: "coordination",
  }]) : Object.freeze([]);
}

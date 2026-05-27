import type {
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
} from "./certificationStateTypes";

export function detectCertificationRecursiveCoordination(
  input: ConstitutionalCertificationInput,
): readonly ConstitutionalCertificationError[] {
  const detected =
    input.antiEmergenceResult.signals.some((signal) => signal.domain === "recursive_coordination" && signal.triggered)
    || input.constitutionalTelemetryResult.events.some((event) => event.domain === "coordination_drift" && event.triggered);
  return detected ? Object.freeze([{
    code: "CONSTITUTIONAL_CERTIFICATION_RECURSIVE_COORDINATION",
    message: "Recursive coordination markers were detected during certification.",
    path: "signals",
  }]) : Object.freeze([]);
}

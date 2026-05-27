import type {
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
} from "./certificationStateTypes";

export function enforceOversightEscalation(
  input: ConstitutionalCertificationInput,
): readonly ConstitutionalCertificationError[] {
  if (
    input.constitutionalReadinessResult.uncertaintyPenalty.penalty > 0
    && !input.constitutionalRuntimeSimulationResult.report.operatorReviewRequired
  ) {
    return Object.freeze([{
      code: "CONSTITUTIONAL_CERTIFICATION_ESCALATION_INSTABILITY",
      message: "Oversight escalation enforcement failed under uncertainty.",
      path: "constitutionalRuntimeSimulationResult.report.operatorReviewRequired",
    }]);
  }
  return Object.freeze([]);
}

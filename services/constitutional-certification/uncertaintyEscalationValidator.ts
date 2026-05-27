import type {
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
} from "./certificationStateTypes";

export function validateUncertaintyEscalation(
  input: ConstitutionalCertificationInput,
): readonly ConstitutionalCertificationError[] {
  if (
    input.constitutionalReadinessResult.uncertaintyPenalty.penalty > 0
    && input.constitutionalReadinessResult.escalationCorrectness.score < 1
    && input.escalationDeterminismResult.record.oversightState === "stable"
  ) {
    return Object.freeze([{
      code: "CONSTITUTIONAL_CERTIFICATION_ESCALATION_INSTABILITY",
      message: "Uncertainty did not increase escalation oversight as required.",
      path: "escalationDeterminismResult.record.oversightState",
    }]);
  }
  return Object.freeze([]);
}

import type {
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
} from "./certificationStateTypes";

export function validateEscalationDrift(
  input: ConstitutionalCertificationInput,
): readonly ConstitutionalCertificationError[] {
  return input.escalationDeterminismResult.record.oversightState === "disputed"
    || input.escalationDeterminismResult.record.oversightState === "revoked"
    ? Object.freeze([{
      code: "CONSTITUTIONAL_CERTIFICATION_ESCALATION_INSTABILITY",
      message: "Escalation drift was detected.",
      path: "escalationDeterminismResult.record.oversightState",
    }])
    : Object.freeze([]);
}

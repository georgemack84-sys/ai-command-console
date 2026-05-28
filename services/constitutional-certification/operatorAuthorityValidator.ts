import type {
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
} from "./certificationStateTypes";

export function validateOperatorAuthority(
  input: ConstitutionalCertificationInput,
): readonly ConstitutionalCertificationError[] {
  const valid =
    input.humanSupremacyResult.record.enforcementState === "ENFORCED"
    || input.humanSupremacyResult.record.enforcementState === "FROZEN"
    || input.humanSupremacyResult.record.enforcementState === "REVOKED"
    || input.humanSupremacyResult.record.enforcementState === "SHUTDOWN";
  return valid ? Object.freeze([]) : Object.freeze([{
    code: "CONSTITUTIONAL_CERTIFICATION_OVERRIDE_FAILURE",
    message: "Operator authority validation failed.",
    path: "humanSupremacyResult.record.enforcementState",
  }]);
}

import type {
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
} from "./certificationStateTypes";

export function validateGovernanceSupremacy(
  input: ConstitutionalCertificationInput,
): readonly ConstitutionalCertificationError[] {
  if (
    input.constitutionalReadinessResult.record.governanceBound
    && input.humanSupremacyResult.record.governanceBound
    && input.escalationDeterminismResult.record.governanceBound
  ) {
    return Object.freeze([]);
  }
  return Object.freeze([{
    code: "CONSTITUTIONAL_CERTIFICATION_GOVERNANCE_AMBIGUITY",
    message: "Governance supremacy chain is incomplete.",
    path: "governanceBound",
  }]);
}

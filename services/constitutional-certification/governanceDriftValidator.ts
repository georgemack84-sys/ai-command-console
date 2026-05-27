import type {
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
} from "./certificationStateTypes";

export function validateGovernanceDrift(
  input: ConstitutionalCertificationInput,
): readonly ConstitutionalCertificationError[] {
  return input.runtimeAdmissibilityResult.governanceCheck.driftDetected
    ? Object.freeze([{
      code: "CONSTITUTIONAL_CERTIFICATION_STALE_GOVERNANCE",
      message: "Governance drift was detected.",
      path: "runtimeAdmissibilityResult.governanceCheck.driftDetected",
    }])
    : Object.freeze([]);
}

import type {
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
} from "./certificationStateTypes";

function hasMarker(input: ConstitutionalCertificationInput, key: string): boolean {
  return input.metadata?.[key] === true;
}

export function detectGovernanceBypass(
  input: ConstitutionalCertificationInput,
): readonly ConstitutionalCertificationError[] {
  if (
    hasMarker(input, "governanceBypass")
    || hasMarker(input, "governanceOverride")
    || input.runtimeAdmissibilityResult.governanceCheck.detached
  ) {
    return Object.freeze([{
      code: "CONSTITUTIONAL_CERTIFICATION_GOVERNANCE_BYPASS",
      message: "Governance bypass markers were detected.",
      path: "metadata",
    }]);
  }
  return Object.freeze([]);
}

import type {
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
} from "./certificationStateTypes";

function hasMarker(input: ConstitutionalCertificationInput, key: string): boolean {
  return input.metadata?.[key] === true;
}

export function detectCertificationAuthorityExpansion(
  input: ConstitutionalCertificationInput,
): readonly ConstitutionalCertificationError[] {
  if (
    hasMarker(input, "authorityGrant")
    || hasMarker(input, "privilegeElevation")
    || input.antiEmergenceResult.signals.some((signal) => signal.domain === "authority_expansion" && signal.triggered)
  ) {
    return Object.freeze([{
      code: "CONSTITUTIONAL_CERTIFICATION_AUTHORITY_DRIFT",
      message: "Authority expansion markers were detected.",
      path: "metadata",
    }]);
  }
  return Object.freeze([]);
}

import type {
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
} from "./certificationStateTypes";

function hasMarker(input: ConstitutionalCertificationInput, key: string): boolean {
  return input.metadata?.[key] === true;
}

export function validateCertificationAuthorityFirewall(
  input: ConstitutionalCertificationInput,
): readonly ConstitutionalCertificationError[] {
  if (
    hasMarker(input, "selfCertification")
    || hasMarker(input, "implicitApproval")
    || hasMarker(input, "authorityGrant")
  ) {
    return Object.freeze([{
      code: "CONSTITUTIONAL_CERTIFICATION_AUTHORITY_CROSSOVER",
      message: "Certification attempted to evolve into authority.",
      path: "metadata",
    }]);
  }
  return Object.freeze([]);
}

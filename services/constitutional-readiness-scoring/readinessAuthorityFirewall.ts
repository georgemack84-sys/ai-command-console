import type {
  ConstitutionalReadinessError,
  ConstitutionalReadinessInput,
} from "./readinessStateTypes";

function hasAuthorityMarker(metadata: Readonly<Record<string, unknown>> | undefined, key: string): boolean {
  return metadata?.[key] === true;
}

export function enforceReadinessAuthorityFirewall(
  input: ConstitutionalReadinessInput,
): readonly ConstitutionalReadinessError[] {
  const errors: ConstitutionalReadinessError[] = [];

  if (
    hasAuthorityMarker(input.metadata, "authorityGrant")
    || hasAuthorityMarker(input.metadata, "certificationAuthority")
    || hasAuthorityMarker(input.metadata, "implicitApproval")
  ) {
    errors.push({
      code: "CONSTITUTIONAL_READINESS_AUTHORITY_CROSSOVER",
      message: "Certification attempted to evolve into authority.",
      path: "metadata",
    });
  }

  if (
    input.constitutionalAuthorityBoundaryResult.authorityContract.executionAuthority
    || input.constitutionalAuthorityBoundaryResult.authorityContract.orchestrationAuthority
    || input.constitutionalAuthorityBoundaryResult.authorityContract.runtimeMutationAuthority
  ) {
    errors.push({
      code: "CONSTITUTIONAL_READINESS_AUTHORITY_CROSSOVER",
      message: "Authority contract exposed forbidden operational powers.",
      path: "constitutionalAuthorityBoundaryResult.authorityContract",
    });
  }

  return Object.freeze(errors);
}

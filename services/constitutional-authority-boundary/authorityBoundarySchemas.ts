import type { AuthorityBoundaryError, AuthorityClass, ConstitutionalAuthorityBoundaryInput } from "./authorityBoundaryTypes";

const AUTHORITY_CLASSES: readonly AuthorityClass[] = Object.freeze(["A0", "A1", "A2", "A3", "A4"]);

export function validateAuthorityBoundaryInput(input: ConstitutionalAuthorityBoundaryInput): readonly AuthorityBoundaryError[] {
  const errors: AuthorityBoundaryError[] = [];
  if (!AUTHORITY_CLASSES.includes(input.requestedAuthorityClass)) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_AUTHORITY_INHERITANCE_AMBIGUOUS",
      message: "Requested authority class is not part of the immutable constitutional authority model.",
      path: "requestedAuthorityClass",
    }));
  }
  if (!input.controlledAutonomyReadinessGateResult.derivedOnly) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_AUTHORITY_VALIDATOR_MISMATCH",
      message: "Authority boundary requires a derived-only controlled autonomy readiness gate result.",
      path: "controlledAutonomyReadinessGateResult.derivedOnly",
    }));
  }
  return Object.freeze(errors);
}

export function normalizeAuthorityMetadata(metadata: Readonly<Record<string, unknown>> | undefined): string {
  return JSON.stringify(metadata ?? {}).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export { AUTHORITY_CLASSES };

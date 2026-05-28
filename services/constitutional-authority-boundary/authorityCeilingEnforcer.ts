import type {
  AuthorityBoundaryError,
  AuthorityClass,
  ConstitutionalAuthorityBoundaryInput,
} from "./authorityBoundaryTypes";

const ORDER: Record<AuthorityClass, number> = {
  A0: 0,
  A1: 1,
  A2: 2,
  A3: 3,
  A4: 4,
};

function maxAllowedClass(input: ConstitutionalAuthorityBoundaryInput): AuthorityClass {
  const state = input.controlledAutonomyReadinessGateResult.record.certificationState;
  switch (state) {
    case "VERIFIED":
      return "A3";
    case "CONDITIONAL":
      return "A2";
    case "DEGRADED":
      return "A1";
    case "DISPUTED":
    case "FROZEN":
    case "INVALID":
    default:
      return "A0";
  }
}

export function enforceAuthorityCeiling(input: ConstitutionalAuthorityBoundaryInput): {
  ceiling: AuthorityClass;
  errors: readonly AuthorityBoundaryError[];
} {
  const ceiling = maxAllowedClass(input);
  const errors: AuthorityBoundaryError[] = [];
  if (ORDER[input.requestedAuthorityClass] > ORDER[ceiling]) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_AUTHORITY_CEILING_VIOLATION",
      message: "Requested authority exceeds the immutable constitutional ceiling.",
      path: "requestedAuthorityClass",
    }));
  }
  return Object.freeze({
    ceiling,
    errors: Object.freeze(errors),
  });
}

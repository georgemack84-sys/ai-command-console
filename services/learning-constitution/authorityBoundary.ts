import type { ActionAuthorizationBoundaryResult, AuthorityBoundaryEvaluator, AuthorityBoundaryReasonCode, AuthorityBoundaryRequest, AuthorityBoundaryResult } from "../../types/learning-constitution";

const scopeIdentity = (scope: Readonly<{ type: string; id?: string }>): string => scope.id ? `${scope.type}:${scope.id}` : scope.type;
const result = (outcome: AuthorityBoundaryResult["outcome"], reasonCode: AuthorityBoundaryReasonCode): AuthorityBoundaryResult => ({ outcome, reasonCode, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false });

/** Applies authority only within an exact, explicitly nested, or global scope. */
export class ScopeBoundAuthorityBoundaryEvaluator implements AuthorityBoundaryEvaluator {
  evaluate(request: AuthorityBoundaryRequest): AuthorityBoundaryResult {
    const authorityScope = request.authority.scope;
    if (authorityScope.type === "GLOBAL") return result("APPLIES", "GLOBAL_SCOPE");
    if (scopeIdentity(authorityScope) === scopeIdentity(request.subjectScope)) return result("APPLIES", "EXACT_SCOPE_MATCH");

    if ("parentScope" in request.subjectScope && request.subjectScope.parentScope && scopeIdentity(authorityScope) === scopeIdentity(request.subjectScope.parentScope)) {
      return result("APPLIES", "EXPLICIT_DESCENDANT_SCOPE");
    }
    if (authorityScope.type === request.subjectScope.type) return result("OUT_OF_SCOPE", "SCOPE_IDENTITY_MISMATCH");
    return result("REQUIRE_REVIEW", "SCOPE_HIERARCHY_UNRESOLVED");
  }
}

/** A knowledge-authority record can never substitute for independent action authorization. */
export const requireSeparateActionAuthorization = (): ActionAuthorizationBoundaryResult => ({
  allowed: false,
  reasonCode: "SEPARATE_ACTION_AUTHORIZATION_REQUIRED",
  persistenceEffect: "NONE",
  authorityEffect: "UNCHANGED",
  executionPermissionGranted: false,
});

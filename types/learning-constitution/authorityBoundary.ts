import type { AuthorityRecord } from "./authorityRecord";
import type { KnowledgeScopeReference } from "./knowledgeScope";

export const AUTHORITY_BOUNDARY_OUTCOMES = ["APPLIES", "OUT_OF_SCOPE", "REQUIRE_REVIEW"] as const;
export type AuthorityBoundaryOutcome = (typeof AUTHORITY_BOUNDARY_OUTCOMES)[number];

export const AUTHORITY_BOUNDARY_REASON_CODES = ["EXACT_SCOPE_MATCH", "EXPLICIT_DESCENDANT_SCOPE", "GLOBAL_SCOPE", "SCOPE_IDENTITY_MISMATCH", "SCOPE_HIERARCHY_UNRESOLVED"] as const;
export type AuthorityBoundaryReasonCode = (typeof AUTHORITY_BOUNDARY_REASON_CODES)[number];

export type AuthorityBoundaryRequest = Readonly<{
  authority: AuthorityRecord;
  subjectScope: KnowledgeScopeReference;
}>;

export type AuthorityBoundaryResult = Readonly<{
  outcome: AuthorityBoundaryOutcome;
  reasonCode: AuthorityBoundaryReasonCode;
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export type ActionAuthorizationBoundaryResult = Readonly<{
  allowed: false;
  reasonCode: "SEPARATE_ACTION_AUTHORIZATION_REQUIRED";
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export interface AuthorityBoundaryEvaluator {
  evaluate(request: AuthorityBoundaryRequest): AuthorityBoundaryResult;
}

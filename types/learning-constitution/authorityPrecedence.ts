import type { AuthorityRecord } from "./authorityRecord";

export const AUTHORITY_PRECEDENCE_OUTCOMES = [
  "COEXIST",
  "CHALLENGE",
  "SUPERSEDE",
  "CORRECT",
  "REVOKE",
  "REQUIRE_REVIEW",
] as const;
export type AuthorityPrecedenceOutcome = (typeof AUTHORITY_PRECEDENCE_OUTCOMES)[number];

export const AUTHORITY_RELATIONSHIP_INTENTS = ["COEXIST", "SUPERSEDE", "CORRECT", "REVOKE"] as const;
export type AuthorityRelationshipIntent = (typeof AUTHORITY_RELATIONSHIP_INTENTS)[number];

export const AUTHORITY_PRECEDENCE_REASON_CODES = [
  "SCOPES_DO_NOT_OVERLAP",
  "EXISTING_AUTHORITY_ALREADY_EXPIRED",
  "NO_REPLACEMENT_CLAIM",
  "EXPLICIT_SUPERSESSION_CANDIDATE",
  "EXPLICIT_CORRECTION_CANDIDATE",
  "EXPLICIT_REVOCATION_REQUIRES_REVIEW",
  "SUPERSESSION_REFERENCE_MISSING",
  "SOURCE_IDENTITY_MISMATCH",
  "REPLACEMENT_PREDATES_EXISTING_AUTHORITY",
] as const;
export type AuthorityPrecedenceReasonCode = (typeof AUTHORITY_PRECEDENCE_REASON_CODES)[number];

export type AuthorityPrecedenceRequest = Readonly<{
  existing: AuthorityRecord;
  incoming: AuthorityRecord;
  relationshipIntent: AuthorityRelationshipIntent;
}>;

export type AuthorityPrecedenceResult = Readonly<{
  outcome: AuthorityPrecedenceOutcome;
  reasonCode: AuthorityPrecedenceReasonCode;
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export interface AuthorityPrecedenceEvaluator {
  evaluate(request: AuthorityPrecedenceRequest): AuthorityPrecedenceResult;
}

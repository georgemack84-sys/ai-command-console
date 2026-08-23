import type { AuthorityPrecedenceResult } from "./authorityPrecedence";
import type { AuthorityRecord } from "./authorityRecord";
import type { ConflictDetectionResult } from "./conflictDetection";

export const AUTHORITY_CONFLICT_OUTCOMES = ["NO_CONFLICT", "COEXIST", "SUPERSEDE_EXISTING", "REJECT_INCOMING", "REQUIRE_VALIDATION", "REQUIRE_HUMAN_REVIEW", "ESCALATE"] as const;
export type AuthorityConflictOutcome = (typeof AUTHORITY_CONFLICT_OUTCOMES)[number];

export const AUTHORITY_CONFLICT_REASON_CODES = ["SCOPES_DO_NOT_OVERLAP", "KNOWLEDGE_COMPATIBLE", "KNOWLEDGE_RELATIONSHIP_UNCERTAIN", "EXPLICIT_AUTHORITY_SUPERSESSION", "AGENT_CLAIM_CANNOT_OVERRIDE_HUMAN_AUTHORITY", "PREFERENCE_CANNOT_OVERRIDE_APPROVED_POLICY", "VERIFIED_EXTERNAL_INFORMATION_CHALLENGES_APPROVED_REFERENCE", "PRECEDENCE_REQUIRES_REVIEW", "CONFLICT_REQUIRES_HUMAN_REVIEW"] as const;
export type AuthorityConflictReasonCode = (typeof AUTHORITY_CONFLICT_REASON_CODES)[number];

export type AuthorityConflictRequest = Readonly<{
  existingAuthority: AuthorityRecord;
  incomingAuthority: AuthorityRecord;
  knowledgeConflict: ConflictDetectionResult;
  precedence: AuthorityPrecedenceResult;
}>;

export type AuthorityConflictResult = Readonly<{
  outcome: AuthorityConflictOutcome;
  reasonCode: AuthorityConflictReasonCode;
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export interface AuthorityConflictDetector {
  detect(request: AuthorityConflictRequest): AuthorityConflictResult;
}

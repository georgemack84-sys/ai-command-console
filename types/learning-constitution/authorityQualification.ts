import type { AuthorityBoundaryResult } from "./authorityBoundary";
import type { AuthorityConfidenceEvidenceEvaluation, AuthorityConfidenceEvidenceProfile } from "./authorityConfidenceEvidence";
import type { AuthorityConflictResult } from "./authorityConflict";
import type { AuthorityGateResult } from "./authorityEnforcement";
import type { AuthorityPrecedenceResult, AuthorityRelationshipIntent } from "./authorityPrecedence";
import type { AuthorityRecord } from "./authorityRecord";
import type { AuthorityResolutionRequest, AuthorityResolutionResult } from "./authorityResolution";
import type { ConflictDetectionResult } from "./conflictDetection";
import type { KnowledgeScopeReference } from "./knowledgeScope";

export const AUTHORITY_QUALIFICATION_STATUSES = ["QUALIFIED", "REVIEW_REQUIRED", "REJECTED"] as const;
export type AuthorityQualificationStatus = (typeof AUTHORITY_QUALIFICATION_STATUSES)[number];

export type AuthorityQualificationRequest = Readonly<{
  resolutionRequest: AuthorityResolutionRequest;
  incomingAuthority: AuthorityRecord;
  existingAuthority: AuthorityRecord;
  subjectScope: KnowledgeScopeReference;
  relationshipIntent: AuthorityRelationshipIntent;
  knowledgeConflict: ConflictDetectionResult;
  profile: AuthorityConfidenceEvidenceProfile;
  delegationValid?: boolean;
}>;

export type AuthorityQualificationResult = Readonly<{
  status: AuthorityQualificationStatus;
  resolution: AuthorityResolutionResult;
  boundary: AuthorityBoundaryResult;
  precedence: AuthorityPrecedenceResult;
  conflict: AuthorityConflictResult;
  profile: AuthorityConfidenceEvidenceEvaluation;
  gate: AuthorityGateResult;
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export interface AuthorityQualificationService {
  qualify(request: AuthorityQualificationRequest): AuthorityQualificationResult;
}

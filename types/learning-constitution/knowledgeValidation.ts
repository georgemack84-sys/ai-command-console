import type { ConflictDetectionResult } from "./conflictDetection";
import type { ClassificationProvenance, InformationClassificationResult } from "./informationClassification";
import type { KnowledgeScope } from "./constitutionalVocabulary";
import type { KnowledgeScopeResolutionResult } from "./knowledgeScope";

export const VALIDATION_OUTCOMES = [
  "VALID",
  "INVALID",
  "REQUIRES_CLARIFICATION",
  "REQUIRES_EVIDENCE",
  "REQUIRES_APPROVAL",
  "CONFLICT_REVIEW_REQUIRED",
  "QUARANTINED",
] as const;
export type ValidationOutcome = (typeof VALIDATION_OUTCOMES)[number];

export const EVIDENCE_TYPES = [
  "OPERATOR_STATEMENT",
  "DOCUMENT",
  "REPOSITORY_OBSERVATION",
  "TOOL_RESULT",
  "EXECUTION_RESULT",
  "EXTERNAL_SOURCE",
  "AGENT_OUTPUT",
] as const;
export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export type KnowledgeEvidence = Readonly<{
  evidenceId: string;
  type: EvidenceType;
  sourceReference: string;
  observedAt: string;
  provenance: ClassificationProvenance;
  supportsCandidate: boolean;
}>;

export const VALIDATION_REASON_CODES = [
  "CLASSIFICATION_UNRESOLVED",
  "SCOPE_UNRESOLVED",
  "PROVENANCE_INCOMPLETE",
  "CONFLICT_REVIEW_REQUIRED",
  "NON_DURABLE_CLASSIFICATION",
  "PREFERENCE_REQUIRES_USER_ATTRIBUTION",
  "FACT_REQUIRES_INDEPENDENT_EVIDENCE",
  "PROJECT_DECISION_REQUIRES_PROJECT_SCOPE",
  "PROJECT_DECISION_REQUIRES_APPROVAL",
  "CORRECTION_TARGET_REQUIRED",
  "CORRECTION_REQUIRES_APPROVAL",
  "EXCEPTION_TARGET_REQUIRED",
  "EXCEPTION_REQUIRES_APPROVAL",
  "AUTHORITATIVE_RULE_REQUIRES_AUTHORITY_VERIFICATION",
  "AUTHORITATIVE_RULE_REQUIRES_APPROVAL",
  "PROCEDURE_REQUIRES_APPROVAL",
  "VALIDATED",
] as const;
export type ValidationReasonCode = (typeof VALIDATION_REASON_CODES)[number];

export type KnowledgeValidationRequest = Readonly<{
  candidateId: string;
  classification: InformationClassificationResult;
  scopeResolution: KnowledgeScopeResolutionResult;
  conflictDetection: ConflictDetectionResult;
  provenance: ClassificationProvenance;
  evidence: readonly KnowledgeEvidence[];
  authorityVerified?: boolean;
}>;

export type KnowledgeValidationResult = Readonly<{
  candidateId: string;
  outcome: ValidationOutcome;
  reasonCode: ValidationReasonCode;
  applicableRules: readonly string[];
  evidenceIds: readonly string[];
  provenance: ClassificationProvenance;
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export interface KnowledgeValidator {
  validate(request: KnowledgeValidationRequest): Promise<KnowledgeValidationResult>;
}

export type ValidationRuleDefinition = Readonly<{
  requiredScopeType?: KnowledgeScope;
  requiresIndependentEvidence: boolean;
  requiresApproval: boolean;
  requiresAuthorityVerification: boolean;
}>;

export const VALIDATION_RULE_MATRIX: Readonly<
  Record<NonNullable<InformationClassificationResult["classification"]>, ValidationRuleDefinition>
> = {
  CONVERSATION: {
    requiresIndependentEvidence: false,
    requiresApproval: false,
    requiresAuthorityVerification: false,
  },
  BRAINSTORMING: {
    requiresIndependentEvidence: false,
    requiresApproval: false,
    requiresAuthorityVerification: false,
  },
  SUGGESTION: {
    requiresIndependentEvidence: false,
    requiresApproval: false,
    requiresAuthorityVerification: false,
  },
  FACT: {
    requiresIndependentEvidence: true,
    requiresApproval: false,
    requiresAuthorityVerification: false,
  },
  PREFERENCE: {
    requiredScopeType: "USER",
    requiresIndependentEvidence: false,
    requiresApproval: false,
    requiresAuthorityVerification: false,
  },
  INSTRUCTION: {
    requiresIndependentEvidence: false,
    requiresApproval: true,
    requiresAuthorityVerification: false,
  },
  PROJECT_DECISION: {
    requiredScopeType: "PROJECT",
    requiresIndependentEvidence: false,
    requiresApproval: true,
    requiresAuthorityVerification: false,
  },
  PRINCIPLE: {
    requiresIndependentEvidence: false,
    requiresApproval: true,
    requiresAuthorityVerification: false,
  },
  PROCEDURE: {
    requiresIndependentEvidence: false,
    requiresApproval: true,
    requiresAuthorityVerification: false,
  },
  CORRECTION: {
    requiresIndependentEvidence: false,
    requiresApproval: true,
    requiresAuthorityVerification: false,
  },
  EXCEPTION: {
    requiresIndependentEvidence: false,
    requiresApproval: true,
    requiresAuthorityVerification: false,
  },
  AUTHORITATIVE_RULE: {
    requiresIndependentEvidence: false,
    requiresApproval: true,
    requiresAuthorityVerification: true,
  },
};

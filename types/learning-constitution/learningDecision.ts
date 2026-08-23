import type { ConflictDetectionResult } from "./conflictDetection";
import type { InformationClassificationResult, ClassificationProvenance } from "./informationClassification";
import type { KnowledgeDisposition } from "./constitutionalVocabulary";
import type { KnowledgeScopeReference, KnowledgeScopeResolutionResult } from "./knowledgeScope";
import type { KnowledgeValidationResult } from "./knowledgeValidation";

export const APPROVAL_STATUSES = [
  "NOT_REQUIRED",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export type ApprovalContext = Readonly<{
  approvalRequired: boolean;
  status: ApprovalStatus;
  approvalId?: string;
  approvedBy?: string;
  approvedAt?: string;
  approvalScope?: KnowledgeScopeReference;
}>;

export type LearningDecisionPolicyContext = Readonly<{
  policyVersion: string;
  constitutionVersion: string;
  constitutionalMutationRequested?: boolean;
  authorityMutationRequested?: boolean;
  automaticConversationLearningRequested?: boolean;
  unknownScopePromotionRequested?: boolean;
  silentConflictResolutionRequested?: boolean;
  procedureExecutionPermissionRequested?: boolean;
  agentGeneratedEvidenceSelfValidated?: boolean;
}>;

export const LEARNING_DECISION_STATUSES = ["FINAL", "PENDING"] as const;
export type LearningDecisionStatus = (typeof LEARNING_DECISION_STATUSES)[number];

export const LEARNING_DECISION_REASON_CODES = [
  "ACCEPTED_FOR_ADMISSION",
  "VALIDATION_REQUIRES_COMPLETION",
  "CONFLICT_REVIEW_REQUIRED",
  "VALIDATION_QUARANTINED",
  "VALIDATION_REJECTED",
  "APPROVAL_PENDING",
  "APPROVAL_REJECTED",
  "APPROVAL_EXPIRED",
  "APPROVAL_SCOPE_INCOMPATIBLE",
  "APPROVAL_CONTEXT_INCOMPLETE",
  "UPSTREAM_RESULT_INCONSISTENT",
  "POLICY_CONTEXT_INCOMPLETE",
  "CONSTITUTIONAL_MUTATION_PROHIBITED",
  "AUTHORITY_MUTATION_PROHIBITED",
  "AUTOMATIC_CONVERSATION_LEARNING_PROHIBITED",
  "UNKNOWN_SCOPE_PROMOTION_PROHIBITED",
  "SILENT_CONFLICT_RESOLUTION_PROHIBITED",
  "PROCEDURE_PERMISSION_ESCALATION_PROHIBITED",
  "AGENT_EVIDENCE_SELF_VALIDATION_PROHIBITED",
] as const;
export type LearningDecisionReasonCode = (typeof LEARNING_DECISION_REASON_CODES)[number];

export type LearningDecisionRequest = Readonly<{
  candidateId: string;
  classification: InformationClassificationResult;
  scopeResolution: KnowledgeScopeResolutionResult;
  conflictDetection: ConflictDetectionResult;
  validation: KnowledgeValidationResult;
  provenance: ClassificationProvenance;
  approval: ApprovalContext;
  policy: LearningDecisionPolicyContext;
}>;

export type LearningDecisionResult = Readonly<{
  candidateId: string;
  disposition: KnowledgeDisposition;
  reasonCode: LearningDecisionReasonCode;
  decisionStatus: LearningDecisionStatus;
  approvalReference?: string;
  policyVersion: string;
  constitutionVersion: string;
  provenance: ClassificationProvenance;
  durableAdmissionEligible: boolean;
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export interface LearningDecisionEngine {
  decide(request: LearningDecisionRequest): Promise<LearningDecisionResult>;
}

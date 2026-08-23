import type { ConflictDetectionResult } from "./conflictDetection";
import type { InformationClassificationResult, ClassificationProvenance } from "./informationClassification";
import type { KnowledgeClassification } from "./constitutionalVocabulary";
import type { LearningDecisionResult } from "./learningDecision";
import type { KnowledgeScopeReference, KnowledgeScopeResolutionResult } from "./knowledgeScope";
import type { KnowledgeValidationResult } from "./knowledgeValidation";
import type { KnowledgeFreshnessAssessment } from "./knowledgeFreshness";

export const KNOWLEDGE_LIFECYCLE_STATES = [
  "ACTIVE",
  "SUPERSEDED",
  "ARCHIVED",
  "QUARANTINED",
] as const;
export type KnowledgeLifecycleState = (typeof KNOWLEDGE_LIFECYCLE_STATES)[number];

export type DurableKnowledgeCandidate = Readonly<{
  candidateId: string;
  content: string;
  classification: KnowledgeClassification;
  provenance: ClassificationProvenance;
}>;

export type KnowledgeLineage = Readonly<{
  candidateId: string;
  observationId: string;
  classificationRationaleCode: string;
  scopeRationaleCode: string;
  conflictRelationship: ConflictDetectionResult["relationship"];
  validationOutcome: KnowledgeValidationResult["outcome"];
  decisionReasonCode: LearningDecisionResult["reasonCode"];
}>;

export type DurableKnowledgeRecord = Readonly<{
  knowledgeId: string;
  candidateId: string;
  content: string;
  classification: KnowledgeClassification;
  scope: KnowledgeScopeReference;
  lifecycleState: KnowledgeLifecycleState;
  createdAt: string;
  effectiveFrom: string;
  provenance: ClassificationProvenance;
  lineage: KnowledgeLineage;
  policyVersion: string;
  constitutionVersion: string;
}>;

export type KnowledgeRepository = Readonly<{
  create(record: DurableKnowledgeRecord): Promise<DurableKnowledgeRecord>;
  getById(knowledgeId: string): Promise<DurableKnowledgeRecord | undefined>;
  findByCandidateId(candidateId: string): Promise<DurableKnowledgeRecord | undefined>;
}>;

export type KnowledgeMetricsRepository = KnowledgeRepository & Readonly<{
  findAll(): Promise<readonly DurableKnowledgeRecord[]>;
}>;

export type KnowledgeAdmittedAuditEvent = Readonly<{
  eventId: string;
  eventType: "KNOWLEDGE_ADMITTED";
  knowledgeId: string;
  candidateId: string;
  occurredAt: string;
  decisionReasonCode: LearningDecisionResult["reasonCode"];
  policyVersion: string;
  constitutionVersion: string;
  provenance: ClassificationProvenance;
}>;

export type KnowledgeSupersession = Readonly<{
  supersessionId: string;
  priorKnowledgeId: string;
  replacementKnowledgeId: string;
  reason: string;
  occurredAt: string;
  provenance: ClassificationProvenance;
  policyVersion: string;
  constitutionVersion: string;
}>;

export type KnowledgeSupersededAuditEvent = Readonly<{
  eventId: string;
  eventType: "KNOWLEDGE_SUPERSEDED";
  supersessionId: string;
  priorKnowledgeId: string;
  replacementKnowledgeId: string;
  occurredAt: string;
  policyVersion: string;
  constitutionVersion: string;
  provenance: ClassificationProvenance;
}>;

export type KnowledgeException = Readonly<{
  exceptionId: string;
  baseKnowledgeId: string;
  exceptionKnowledgeId: string;
  applicabilityCondition: string;
  reason: string;
  occurredAt: string;
  provenance: ClassificationProvenance;
  policyVersion: string;
  constitutionVersion: string;
}>;

export type KnowledgeExceptionRegisteredAuditEvent = Readonly<{
  eventId: string;
  eventType: "KNOWLEDGE_EXCEPTION_REGISTERED";
  exceptionId: string;
  baseKnowledgeId: string;
  exceptionKnowledgeId: string;
  occurredAt: string;
  policyVersion: string;
  constitutionVersion: string;
  provenance: ClassificationProvenance;
}>;

export type KnowledgeLifecycleChangedAuditEvent = Readonly<{
  eventId: string;
  eventType: "KNOWLEDGE_ARCHIVED" | "KNOWLEDGE_QUARANTINED";
  knowledgeId: string;
  priorLifecycleState: "ACTIVE";
  newLifecycleState: "ARCHIVED" | "QUARANTINED";
  reason: string;
  occurredAt: string;
  policyVersion: string;
  constitutionVersion: string;
  provenance: ClassificationProvenance;
}>;

export const KNOWLEDGE_REVIEW_OUTCOMES = [
  "CONFIRMED",
  "UNVERIFIABLE",
  "CONTRADICTED",
] as const;
export type KnowledgeReviewOutcome = (typeof KNOWLEDGE_REVIEW_OUTCOMES)[number];

export type KnowledgeReview = Readonly<{
  reviewId: string;
  knowledgeId: string;
  outcome: KnowledgeReviewOutcome;
  evidenceIds: readonly string[];
  reviewerId: string;
  reviewedAt: string;
  policyVersion: string;
  constitutionVersion: string;
  provenance: ClassificationProvenance;
}>;

export type KnowledgeReviewAuditEvent = Readonly<{
  eventId: string;
  eventType: "KNOWLEDGE_REVALIDATED" | "KNOWLEDGE_REVIEW_FAILED";
  reviewId: string;
  knowledgeId: string;
  outcome: KnowledgeReviewOutcome;
  occurredAt: string;
  policyVersion: string;
  constitutionVersion: string;
  provenance: ClassificationProvenance;
}>;

export type KnowledgeReviewWorkItemAuditEvent = Readonly<{
  eventId: string;
  eventType: "KNOWLEDGE_REVIEW_WORK_QUEUED" | "KNOWLEDGE_REVIEW_WORK_COMPLETED";
  workItemId: string;
  knowledgeId: string;
  occurredAt: string;
  policyVersion: string;
  constitutionVersion: string;
  provenance: ClassificationProvenance;
}>;

export type GovernanceReviewProposalAuditEvent = Readonly<{
  eventId: string;
  eventType: "GOVERNANCE_REVIEW_PROPOSED" | "GOVERNANCE_REVIEW_DECIDED";
  proposalId: string;
  scopeKey: string;
  occurredAt: string;
  policyVersion: string;
  constitutionVersion: string;
  provenance: ClassificationProvenance;
}>;

export type OperationalPolicyActivatedAuditEvent = Readonly<{
  eventId: string;
  eventType: "OPERATIONAL_POLICY_ACTIVATED";
  policyId: string;
  policyVersion: string;
  scopeKey: string;
  proposalId: string;
  occurredAt: string;
  constitutionVersion: string;
  provenance: ClassificationProvenance;
}>;

export type OperationalPolicyRolledBackAuditEvent = Readonly<{
  eventId: string;
  eventType: "OPERATIONAL_POLICY_ROLLED_BACK";
  policyId: string;
  fromVersion: string;
  toVersion: string;
  scopeKey: string;
  occurredAt: string;
  constitutionVersion: string;
  provenance: ClassificationProvenance;
}>;

export type KnowledgeAuditEvent =
  | KnowledgeAdmittedAuditEvent
  | KnowledgeSupersededAuditEvent
  | KnowledgeExceptionRegisteredAuditEvent
  | KnowledgeLifecycleChangedAuditEvent
  | KnowledgeReviewAuditEvent
  | KnowledgeReviewWorkItemAuditEvent
  | GovernanceReviewProposalAuditEvent
  | OperationalPolicyActivatedAuditEvent
  | OperationalPolicyRolledBackAuditEvent;

export type AuditIntegrityEntry = Readonly<{
  auditKey: string;
  sequence: number;
  eventId: string;
  eventHash: string;
  previousHash?: string;
}>;

export type KnowledgeAuditLedger = Readonly<{
  append<T extends KnowledgeAuditEvent>(event: T): Promise<T>;
  findByKnowledgeId(knowledgeId: string): Promise<readonly KnowledgeAuditEvent[]>;
  findAll(): Promise<readonly KnowledgeAuditEvent[]>;
  findIntegrityEntries(auditKey: string): Promise<readonly AuditIntegrityEntry[]>;
}>;

export type KnowledgeAdmissionRequest = Readonly<{
  candidate: DurableKnowledgeCandidate;
  classification: InformationClassificationResult;
  scopeResolution: KnowledgeScopeResolutionResult;
  conflictDetection: ConflictDetectionResult;
  validation: KnowledgeValidationResult;
  decision: LearningDecisionResult;
}>;

export const KNOWLEDGE_ADMISSION_STATUSES = [
  "ADMITTED",
  "REJECTED",
  "DEFERRED",
  "PERSISTENCE_FAILED",
] as const;
export type KnowledgeAdmissionStatus = (typeof KNOWLEDGE_ADMISSION_STATUSES)[number];

export const KNOWLEDGE_ADMISSION_REASON_CODES = [
  "KNOWLEDGE_ADMITTED",
  "IDEMPOTENT_REPLAY",
  "DECISION_NOT_ACCEPTED",
  "ADMISSION_NOT_ELIGIBLE",
  "SCOPE_UNRESOLVED",
  "LINEAGE_INCONSISTENT",
  "POLICY_VERSION_MISSING",
  "CONSTITUTION_VERSION_MISSING",
  "AUTHORITY_EFFECT_VIOLATION",
  "PERSISTENCE_FAILED",
] as const;
export type KnowledgeAdmissionReasonCode = (typeof KNOWLEDGE_ADMISSION_REASON_CODES)[number];

export type KnowledgeAdmissionResult = Readonly<{
  status: KnowledgeAdmissionStatus;
  reasonCode: KnowledgeAdmissionReasonCode;
  knowledgeRecord?: DurableKnowledgeRecord;
  auditEvent?: KnowledgeAdmittedAuditEvent;
  created: boolean;
  idempotentReplay: boolean;
  persistenceEffect: "CREATED" | "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export interface KnowledgeAdmissionService {
  admit(request: KnowledgeAdmissionRequest): Promise<KnowledgeAdmissionResult>;
}

export type KnowledgeSupersessionTransition = Readonly<{
  priorKnowledgeId: string;
  replacementKnowledgeId: string;
  relationship: KnowledgeSupersession;
}>;

export type KnowledgeSupersessionTransitionResult = Readonly<{
  priorRecord: DurableKnowledgeRecord;
  replacementRecord: DurableKnowledgeRecord;
  relationship: KnowledgeSupersession;
}>;

export type KnowledgeLifecycleRepository = KnowledgeRepository & Readonly<{
  supersede(transition: KnowledgeSupersessionTransition): Promise<KnowledgeSupersessionTransitionResult>;
  findSupersessionByReplacementId(replacementKnowledgeId: string): Promise<KnowledgeSupersession | undefined>;
  registerException(transition: KnowledgeExceptionRegistration): Promise<KnowledgeExceptionRegistrationResult>;
  findExceptionByKnowledgeId(exceptionKnowledgeId: string): Promise<KnowledgeException | undefined>;
  transitionLifecycle(transition: KnowledgeLifecycleTransition): Promise<KnowledgeLifecycleTransitionResult>;
}>;

export type KnowledgeLifecycleTransition = Readonly<{
  knowledgeId: string;
  newLifecycleState: "ARCHIVED" | "QUARANTINED";
}>;

export type KnowledgeLifecycleTransitionResult = Readonly<{
  priorRecord: DurableKnowledgeRecord;
  updatedRecord: DurableKnowledgeRecord;
}>;

export type KnowledgeRetrievalRepository = KnowledgeLifecycleRepository & Readonly<{
  findActiveByScope(scope: KnowledgeScopeReference): Promise<readonly DurableKnowledgeRecord[]>;
  findExceptionsByBaseKnowledgeId(baseKnowledgeId: string): Promise<readonly KnowledgeException[]>;
  findLatestReviewByKnowledgeId(knowledgeId: string): Promise<KnowledgeReview | undefined>;
}>;

export type KnowledgeReviewRepository = KnowledgeRepository & Readonly<{
  createReview(review: KnowledgeReview): Promise<KnowledgeReview>;
  findReviewById(reviewId: string): Promise<KnowledgeReview | undefined>;
  findLatestReviewByKnowledgeId(knowledgeId: string): Promise<KnowledgeReview | undefined>;
}>;

export type KnowledgeExceptionRegistration = Readonly<{
  baseKnowledgeId: string;
  exceptionKnowledgeId: string;
  relationship: KnowledgeException;
}>;

export type KnowledgeExceptionRegistrationResult = Readonly<{
  baseRecord: DurableKnowledgeRecord;
  exceptionRecord: DurableKnowledgeRecord;
  relationship: KnowledgeException;
}>;

export type KnowledgeSupersessionRequest = Readonly<{
  priorKnowledgeId: string;
  replacementKnowledgeId: string;
  reason: string;
  conflictDetection: ConflictDetectionResult;
}>;

export const KNOWLEDGE_SUPERSESSION_STATUSES = [
  "SUPERSEDED",
  "REJECTED",
  "DEFERRED",
  "PERSISTENCE_FAILED",
] as const;
export type KnowledgeSupersessionStatus = (typeof KNOWLEDGE_SUPERSESSION_STATUSES)[number];

export const KNOWLEDGE_SUPERSESSION_REASON_CODES = [
  "KNOWLEDGE_SUPERSEDED",
  "IDEMPOTENT_REPLAY",
  "PRIOR_KNOWLEDGE_NOT_FOUND",
  "REPLACEMENT_KNOWLEDGE_NOT_FOUND",
  "PRIOR_KNOWLEDGE_NOT_ACTIVE",
  "REPLACEMENT_KNOWLEDGE_NOT_ACTIVE",
  "REPLACEMENT_NOT_CORRECTION",
  "CORRECTION_REFERENCE_MISMATCH",
  "SCOPE_INCOMPATIBLE",
  "LINEAGE_INCONSISTENT",
  "AUTHORITY_EFFECT_VIOLATION",
  "PERSISTENCE_FAILED",
] as const;
export type KnowledgeSupersessionReasonCode = (typeof KNOWLEDGE_SUPERSESSION_REASON_CODES)[number];

export type KnowledgeSupersessionResult = Readonly<{
  status: KnowledgeSupersessionStatus;
  reasonCode: KnowledgeSupersessionReasonCode;
  priorRecord?: DurableKnowledgeRecord;
  replacementRecord?: DurableKnowledgeRecord;
  relationship?: KnowledgeSupersession;
  auditEvent?: KnowledgeSupersededAuditEvent;
  created: boolean;
  idempotentReplay: boolean;
  persistenceEffect: "UPDATED" | "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export interface KnowledgeSupersessionService {
  supersede(request: KnowledgeSupersessionRequest): Promise<KnowledgeSupersessionResult>;
}

export type KnowledgeExceptionRegistrationRequest = Readonly<{
  baseKnowledgeId: string;
  exceptionKnowledgeId: string;
  applicabilityCondition: string;
  reason: string;
  conflictDetection: ConflictDetectionResult;
}>;

export const KNOWLEDGE_EXCEPTION_REGISTRATION_STATUSES = [
  "REGISTERED",
  "REJECTED",
  "DEFERRED",
  "PERSISTENCE_FAILED",
] as const;
export type KnowledgeExceptionRegistrationStatus =
  (typeof KNOWLEDGE_EXCEPTION_REGISTRATION_STATUSES)[number];

export const KNOWLEDGE_EXCEPTION_REGISTRATION_REASON_CODES = [
  "KNOWLEDGE_EXCEPTION_REGISTERED",
  "IDEMPOTENT_REPLAY",
  "BASE_KNOWLEDGE_NOT_FOUND",
  "EXCEPTION_KNOWLEDGE_NOT_FOUND",
  "BASE_KNOWLEDGE_NOT_ACTIVE",
  "EXCEPTION_KNOWLEDGE_NOT_ACTIVE",
  "EXCEPTION_NOT_CLASSIFIED",
  "EXCEPTION_REFERENCE_MISMATCH",
  "APPLICABILITY_CONDITION_MISSING",
  "SCOPE_INCOMPATIBLE",
  "LINEAGE_INCONSISTENT",
  "AUTHORITY_EFFECT_VIOLATION",
  "PERSISTENCE_FAILED",
] as const;
export type KnowledgeExceptionRegistrationReasonCode =
  (typeof KNOWLEDGE_EXCEPTION_REGISTRATION_REASON_CODES)[number];

export type KnowledgeExceptionRegistrationServiceResult = Readonly<{
  status: KnowledgeExceptionRegistrationStatus;
  reasonCode: KnowledgeExceptionRegistrationReasonCode;
  baseRecord?: DurableKnowledgeRecord;
  exceptionRecord?: DurableKnowledgeRecord;
  relationship?: KnowledgeException;
  auditEvent?: KnowledgeExceptionRegisteredAuditEvent;
  created: boolean;
  idempotentReplay: boolean;
  persistenceEffect: "CREATED" | "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export interface KnowledgeExceptionRegistrationService {
  register(request: KnowledgeExceptionRegistrationRequest): Promise<KnowledgeExceptionRegistrationServiceResult>;
}

export type KnowledgeRetrievalRequest = Readonly<{
  scope: KnowledgeScopeReference;
  knowledgeId?: string;
  contentQuery?: string;
  contextFacts?: readonly string[];
}>;

export const KNOWLEDGE_RETRIEVAL_STATUSES = [
  "APPLICABLE",
  "NOT_FOUND",
  "AMBIGUOUS",
  "OUT_OF_SCOPE",
  "INSUFFICIENT_CONTEXT",
  "RETRIEVAL_FAILED",
] as const;
export type KnowledgeRetrievalStatus = (typeof KNOWLEDGE_RETRIEVAL_STATUSES)[number];

export const KNOWLEDGE_RETRIEVAL_REASON_CODES = [
  "ACTIVE_KNOWLEDGE_APPLIES",
  "ACTIVE_EXCEPTION_APPLIES",
  "NO_ACTIVE_KNOWLEDGE_MATCH",
  "KNOWLEDGE_NOT_ACTIVE",
  "KNOWLEDGE_OUT_OF_SCOPE",
  "QUERY_AMBIGUOUS",
  "EXCEPTION_CONTEXT_REQUIRED",
  "RETRIEVAL_FAILED",
] as const;
export type KnowledgeRetrievalReasonCode = (typeof KNOWLEDGE_RETRIEVAL_REASON_CODES)[number];

export type KnowledgeRetrievalResult = Readonly<{
  status: KnowledgeRetrievalStatus;
  reasonCode: KnowledgeRetrievalReasonCode;
  applicableKnowledge?: DurableKnowledgeRecord;
  baseKnowledge?: DurableKnowledgeRecord;
  appliedException?: KnowledgeException;
  candidateKnowledge: readonly DurableKnowledgeRecord[];
  evaluatedExceptionIds: readonly string[];
  review?: KnowledgeReview;
  freshness?: KnowledgeFreshnessAssessment;
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export interface KnowledgeRetrievalService {
  retrieve(request: KnowledgeRetrievalRequest): Promise<KnowledgeRetrievalResult>;
}

export type KnowledgeRetirementRequest = Readonly<{
  knowledgeId: string;
  targetLifecycleState: "ARCHIVED" | "QUARANTINED";
  reason: string;
}>;

export const KNOWLEDGE_RETIREMENT_STATUSES = [
  "TRANSITIONED",
  "REJECTED",
  "PERSISTENCE_FAILED",
] as const;
export type KnowledgeRetirementStatus = (typeof KNOWLEDGE_RETIREMENT_STATUSES)[number];

export const KNOWLEDGE_RETIREMENT_REASON_CODES = [
  "KNOWLEDGE_ARCHIVED",
  "KNOWLEDGE_QUARANTINED",
  "IDEMPOTENT_REPLAY",
  "KNOWLEDGE_NOT_FOUND",
  "KNOWLEDGE_NOT_ACTIVE",
  "RETIREMENT_REASON_MISSING",
  "LINEAGE_INCONSISTENT",
  "PERSISTENCE_FAILED",
] as const;
export type KnowledgeRetirementReasonCode = (typeof KNOWLEDGE_RETIREMENT_REASON_CODES)[number];

export type KnowledgeRetirementResult = Readonly<{
  status: KnowledgeRetirementStatus;
  reasonCode: KnowledgeRetirementReasonCode;
  priorRecord?: DurableKnowledgeRecord;
  updatedRecord?: DurableKnowledgeRecord;
  auditEvent?: KnowledgeLifecycleChangedAuditEvent;
  created: boolean;
  idempotentReplay: boolean;
  persistenceEffect: "UPDATED" | "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export interface KnowledgeRetirementService {
  transition(request: KnowledgeRetirementRequest): Promise<KnowledgeRetirementResult>;
}

export type KnowledgeRevalidationRequest = Readonly<{
  reviewId: string;
  knowledgeId: string;
  outcome: KnowledgeReviewOutcome;
  evidenceIds: readonly string[];
  reviewerId: string;
}>;

export const KNOWLEDGE_REVALIDATION_STATUSES = [
  "REVALIDATED",
  "REVIEW_FAILED",
  "REJECTED",
  "PERSISTENCE_FAILED",
] as const;
export type KnowledgeRevalidationStatus = (typeof KNOWLEDGE_REVALIDATION_STATUSES)[number];

export const KNOWLEDGE_REVALIDATION_REASON_CODES = [
  "KNOWLEDGE_REVALIDATED",
  "EVIDENCE_UNVERIFIABLE",
  "EVIDENCE_CONTRADICTED",
  "IDEMPOTENT_REPLAY",
  "KNOWLEDGE_NOT_FOUND",
  "KNOWLEDGE_NOT_ACTIVE",
  "REVIEW_ID_CONFLICT",
  "EVIDENCE_MISSING",
  "REVIEWER_MISSING",
  "LINEAGE_INCONSISTENT",
  "PERSISTENCE_FAILED",
] as const;
export type KnowledgeRevalidationReasonCode = (typeof KNOWLEDGE_REVALIDATION_REASON_CODES)[number];

export type KnowledgeRevalidationResult = Readonly<{
  status: KnowledgeRevalidationStatus;
  reasonCode: KnowledgeRevalidationReasonCode;
  knowledgeRecord?: DurableKnowledgeRecord;
  review?: KnowledgeReview;
  auditEvent?: KnowledgeReviewAuditEvent;
  recommendedLifecycleState?: "QUARANTINED";
  created: boolean;
  idempotentReplay: boolean;
  persistenceEffect: "CREATED" | "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export interface KnowledgeRevalidationService {
  revalidate(request: KnowledgeRevalidationRequest): Promise<KnowledgeRevalidationResult>;
}

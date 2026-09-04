import type { ProvenanceActor } from "./provenance";

export type RetentionStage = "NOT_EVALUATED" | "IMMEDIATE_ONLY" | "SHORT_TERM_RETAINED" | "MEDIUM_TERM_RETAINED" | "LONG_TERM_RETAINED" | "DURABLY_RETAINED" | "RETENTION_AT_RISK" | "DEGRADED" | "REMEDIATION_REQUIRED";
export type RetentionCheckpoint = "IMMEDIATE" | "SHORT_TERM" | "MEDIUM_TERM" | "LONG_TERM" | "NATURAL_USE" | "ADVERSARIAL" | "REACTIVATION";
export type RetentionOutcome = "PASS" | "FAIL" | "INCONCLUSIVE";
export type RetentionEvidenceValidity = "VALID" | "INVALID" | "STALE" | "SUPERSEDED";
export type RetentionEvidenceStrength = "WEAK" | "MODERATE" | "STRONG";
export type RetentionAuditType = "RETENTION_RECORD_CREATED" | "RETENTION_EVIDENCE_RECORDED" | "RETENTION_STAGE_ADVANCED" | "RETENTION_FAILURE_RECORDED" | "RETENTION_EVIDENCE_REJECTED" | "RETENTION_REMEDIATION_REQUIRED";
export type KnowledgeVolatility = "STABLE" | "SEMI_STABLE" | "VOLATILE";
export type RetentionReviewPriority = Readonly<{ retentionId: string; score: number; due: boolean; rationale: string }>;
export type RetentionSchedule = Readonly<{ retentionId: string; currentIntervalHours: number; nextIntervalHours: number; nextReviewAt: string; reason: string; schedulingEffect: "RECOMMENDATION_ONLY"; executionPermissionGranted: false }>;
export type RetentionReviewBudget = Readonly<{ maximumReviews: number; maximumEvaluationMinutes: number; maximumAdversarialReviews: number }>;
export type RetentionReviewCandidate = Readonly<{ record: RetentionRecord; importance: number; decayRisk: number; dependencyImportance: number; failureHistory: number; usageProbability: number; uncertainty: number; volatility: KnowledgeVolatility; lastEvidenceStrength: RetentionEvidenceStrength; lastOutcome: RetentionOutcome; adversarial: boolean }>;
/** Idempotency reservation only. This is not a Learning Constitution execution authorization. */
export type RetentionReviewLease = Readonly<{ leaseId: string; retentionId: string; reviewKey: string; issuedAt: string; expiresAt: string; status: "ACTIVE" | "EXPIRED"; executionPermissionGranted: false; durableKnowledgeEffect: "NONE" }>;
/** A governed handoff to existing Practice and Evaluation components; it is not an executable exercise. */
export type RetentionReviewPlan = Readonly<{ planId: string; retentionId: string; skillId: string; checkpoint: RetentionCheckpoint; route: "PRACTICE_AND_EVALUATION" | "PREREQUISITE_REMEDIATION" | "KNOWLEDGE_REVALIDATION" | "BLOCKED"; requiredTransfer: "MODIFIED" | "NOVEL" | "EDGE" | "ADVERSARIAL"; prerequisiteSkillIds: readonly string[]; reason: string; executionPermissionGranted: false; durableKnowledgeEffect: "NONE" }>;
export type RetentionFailureClass = "RECALL_FAILURE" | "CONCEPTUAL_FAILURE" | "APPLICATION_FAILURE" | "GENERALIZATION_FAILURE" | "BOUNDARY_FAILURE" | "EXCEPTION_FAILURE" | "PREREQUISITE_FAILURE" | "CALIBRATION_FAILURE";
export type RetentionFailureDiagnosis = Readonly<{ diagnosisId: string; retentionId: string; evidenceId: string; skillId: string; failureClass: RetentionFailureClass; reflectionFailureType: import("./reflectionEngine").ReflectionFailureType; targetSkillId: string | null; status: "LOCALIZED" | "INSUFFICIENT_EVIDENCE"; rationale: string; createdAt: string; durableKnowledgeEffect: "NONE"; executionPermissionGranted: false }>;
export type RetentionActivityState = "ACTIVE" | "MAINTENANCE" | "DORMANT" | "REACTIVATING";
export type DurableRetentionAssessment = Readonly<{ retentionId: string; status: "ELIGIBLE" | "INSUFFICIENT_EVIDENCE" | "BLOCKED"; independentDelayedPasses: number; adversarialPasses: number; distinctContexts: number; reason: string; durableKnowledgeEffect: "NONE"; executionPermissionGranted: false }>;
export type RetentionKnowledgeDisposition = Readonly<{ retentionId: string; action: "CONTINUE" | "CANCEL_REVIEW" | "REVALIDATE_KNOWLEDGE"; reason: string; retentionEffect: "NONE"; durableKnowledgeEffect: "NONE"; executionPermissionGranted: false }>;
export type RetentionActivityTransition = Readonly<{ retentionId: string; from: RetentionActivityState; to: RetentionActivityState; reason: string; createdAt: string; executionPermissionGranted: false; durableKnowledgeEffect: "NONE" }>;

/** Immutable, attributable proof used to support or challenge retention; passing time is deliberately not evidence. */
export type RetentionEvidence = Readonly<{
  evidenceId: string;
  retentionId: string;
  skillId: string;
  checkpoint: RetentionCheckpoint;
  outcome: RetentionOutcome;
  validity: RetentionEvidenceValidity;
  strength: RetentionEvidenceStrength;
  independentExecution: boolean;
  novelContext: boolean;
  answerExposed: boolean;
  evaluationReferenceId: string;
  sourceKnowledgeStatus: "ACTIVE" | "SUPERSEDED" | "RETIRED";
  occurredAt: string;
  createdBy: ProvenanceActor;
  immutable: true;
  durableKnowledgeEffect: "NONE";
  executionPermissionGranted: false;
}>;

export type RetentionRecord = Readonly<{
  retentionId: string;
  skillId: string;
  competencyClaimId: string;
  initialLearningEventId: string;
  initialLearningAt: string;
  stage: RetentionStage;
  evidenceIds: readonly string[];
  lastSuccessfulDemonstrationAt: string | null;
  lastFailureAt: string | null;
  nextReviewAt: string | null;
  remediationRequired: boolean;
  /** Last earned stage suspended by a valid failure; only a governed retest may restore it. */
  suspendedStage: RetentionStage | null;
  createdAt: string;
  updatedAt: string;
  immutable: true;
  durableKnowledgeEffect: "NONE";
  executionPermissionGranted: false;
}>;

export type RetentionTransition = Readonly<{
  record: RetentionRecord;
  accepted: boolean;
  advanced: boolean;
  reason: string;
  requiresRemediation: boolean;
}>;

export type RetentionArtifactRecord = Readonly<{
  artifactId: string;
  artifactType: "RECORD" | "EVIDENCE" | "TRANSITION" | "REMEDIATION" | "SCHEDULE" | "REVIEW_LEASE" | "REVIEW_PLAN" | "FAILURE_DIAGNOSIS" | "DURABILITY_ASSESSMENT" | "KNOWLEDGE_DISPOSITION" | "ACTIVITY_TRANSITION";
  subjectId: string;
  payload: unknown;
  createdAt: string;
}>;

export interface RetentionArtifactStore {
  append(artifact: RetentionArtifactRecord): Promise<RetentionArtifactRecord>;
  listArtifacts(subjectId: string): Promise<readonly RetentionArtifactRecord[]>;
  listWorkspaceArtifacts(): Promise<readonly RetentionArtifactRecord[]>;
}

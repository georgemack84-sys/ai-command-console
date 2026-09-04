import type { ProvenanceActor } from "./provenance";
import type { KnowledgeClassification } from "./constitutionalVocabulary";
import type { KnowledgeScopeReference } from "./knowledgeScope";

export const CORRECTION_EXPLICITNESS = ["EXPLICIT", "IMPLICIT"] as const;
export type CorrectionExplicitness = (typeof CORRECTION_EXPLICITNESS)[number];
export const CORRECTION_PROCESSING_STATUSES = ["DETECTED", "ANALYZING", "TARGET_UNRESOLVED", "VALIDATING", "REPAIR_PENDING", "REPAIRED", "RETESTING", "RESOLVED", "ESCALATED", "REJECTED"] as const;
export type CorrectionProcessingStatus = (typeof CORRECTION_PROCESSING_STATUSES)[number];
export const CORRECTION_ERROR_TYPES = ["FACTUAL_ERROR", "MISINTERPRETATION", "OVERGENERALIZATION", "UNDERGENERALIZATION", "SCOPE_ERROR", "EXCEPTION_MISSED", "STALE_KNOWLEDGE", "AUTHORITY_ERROR", "CONFLICT_ERROR", "INFERENCE_ERROR", "APPLICATION_ERROR", "PROCEDURAL_ERROR", "AMBIGUITY_ERROR", "UNKNOWN_ERROR"] as const;
export type CorrectionErrorType = (typeof CORRECTION_ERROR_TYPES)[number];
export const CORRECTION_SEVERITIES = ["MINOR", "MODERATE", "MAJOR", "CRITICAL"] as const;
export type CorrectionSeverity = (typeof CORRECTION_SEVERITIES)[number];
export const CORRECTION_TARGET_RESOLUTIONS = ["DIRECT_TARGET", "LIKELY_TARGET", "MULTIPLE_TARGETS", "UNRESOLVED_TARGET"] as const;
export type CorrectionTargetResolution = (typeof CORRECTION_TARGET_RESOLUTIONS)[number];

/** An intake signal is evidence of a possible error; it cannot repair knowledge. */
export type CorrectionSignal = Readonly<{ correctionId: string; sourceEventId: string; sourceText: string; detectedPhrase?: string; targetCandidateIds: readonly string[]; explicitness: CorrectionExplicitness; confidence: number; actor: ProvenanceActor; timestamp: string; processingStatus: CorrectionProcessingStatus; immutable: true }>;
export type CorrectionTarget = Readonly<{ targetId: string; confidence: number; rationale: string }>;
export type CorrectionAnalysis = Readonly<{ correctionId: string; targetResolution: CorrectionTargetResolution; targets: readonly CorrectionTarget[]; errorType: CorrectionErrorType; severity: CorrectionSeverity; rationale: string; analyzedAt: string; immutable: true }>;
/** A dependency impact means review is required; it never means the dependent is automatically invalid. */
export type CorrectionDependencyImpact = Readonly<{ impactId: string; correctionId: string; correctedTargetId: string; affectedRecordId: string; affectedRecordType: string; path: readonly string[]; depth: number; status: "POTENTIALLY_AFFECTED" | "HISTORICAL_ONLY"; detectedAt: string; immutable: true }>;
export type CorrectionImpactAssessment = Readonly<{ correctionId: string; impacts: readonly CorrectionDependencyImpact[]; analyzedAt: string; immutable: true; persistenceEffect: "CREATED" | "IDEMPOTENT_REPLAY" | "NONE"; authorityEffect: "UNCHANGED"; executionPermissionGranted: false }>;
export const CORRECTION_GENERALIZATION_RESULTS = ["LOCAL", "DISCOVERY_ONLY"] as const;
export type CorrectionGeneralizationResult = (typeof CORRECTION_GENERALIZATION_RESULTS)[number];
export const CORRECTION_REPAIR_OPERATIONS = ["KEEP", "REINTERPRET", "NARROW_SCOPE", "EXPAND_SCOPE", "ADD_EXCEPTION", "MERGE", "SUPERSEDE", "INVALIDATE", "RETRACT", "REQUEST_CLARIFICATION", "ESCALATE"] as const;
export type CorrectionRepairOperation = (typeof CORRECTION_REPAIR_OPERATIONS)[number];
/** Candidate evidence extracted from a correction. It is not durable knowledge and cannot bypass the learning gate. */
export type CorrectedKnowledgeCandidate = Readonly<{ candidateId: string; correctionId: string; targetIds: readonly string[]; rejectedInterpretation: string; correctedStatement: string; rationale: string; classification: KnowledgeClassification; scope: KnowledgeScopeReference; nonApplicabilityBoundary: string; generalizationResult: CorrectionGeneralizationResult; similarKnowledgeCandidateIds: readonly string[]; extractedBy: ProvenanceActor; extractedAt: string; status: "EXTRACTED" | "REQUIRES_CLARIFICATION"; immutable: true }>;
export type CorrectionExtractionInput = Omit<CorrectedKnowledgeCandidate, "status" | "immutable">;
/** A repair plan cannot execute itself; execution requires the gate and, where needed, explicit human authorization. */
export type CorrectionRepairPlan = Readonly<{ planId: string; correctionId: string; targetIds: readonly string[]; correctedCandidateId: string; operation: CorrectionRepairOperation; rationale: string; authorization: "GATE_REQUIRED" | "HUMAN_REVIEW_REQUIRED" | "CLARIFICATION_REQUIRED" | "ESCALATION_REQUIRED"; plannedAt: string; immutable: true }>;
/** Frozen before repair so a changed knowledge state cannot rewrite the test it must satisfy. */
export type CorrectionRegressionCase = Readonly<{ regressionCaseId: string; correctionId: string; protectsCandidateId: string; errorType: CorrectionErrorType; scenario: string; expectedBehavior: string; counterexample: string; createdAt: string; immutable: true }>;
export type CorrectionRetestEvidence = Readonly<{ retestId: string; correctionId: string; regressionCaseId: string; actualBehavior: string; outcome: "PASS" | "FAIL" | "INCONCLUSIVE"; findings: readonly string[]; evaluatedAt: string; immutable: true }>;
/** Human- or evaluator-supplied diagnosis of how a correction became necessary; it is an engineering signal, not a policy change. */
export type CorrectionRootCauseAnalysis = Readonly<{ rootCauseId: string; correctionId: string; errorType: CorrectionErrorType; immediateCause: string; deeperCause: string; controlFailure: string; mechanism: "CLASSIFICATION" | "SCOPE_RESOLUTION" | "AUTHORITY" | "CONFLICT_RESOLUTION" | "GATE" | "INFERENCE" | "EXECUTION" | "UNKNOWN"; identifiedAt: string; immutable: true }>;
export type SystemImprovementCandidate = Readonly<{ improvementId: string; errorType: CorrectionErrorType; correctionIds: readonly string[]; patternDescription: string; recommendedInvestigation: string; detectedAt: string; status: "DETECTED"; immutable: true; mutationAuthorized: false }>;
export type CorrectionRecord = Readonly<{ correctionId: string; signal: CorrectionSignal; status: CorrectionProcessingStatus; analyses: readonly CorrectionAnalysis[]; impacts: readonly CorrectionDependencyImpact[]; candidates: readonly CorrectedKnowledgeCandidate[]; plans: readonly CorrectionRepairPlan[]; regressionCases: readonly CorrectionRegressionCase[]; retests: readonly CorrectionRetestEvidence[]; rootCauses: readonly CorrectionRootCauseAnalysis[]; immutable: true }>;
export type CorrectionDetectionInput = Readonly<{ correctionId: string; sourceEventId: string; sourceText: string; actor: ProvenanceActor; timestamp: string; targetCandidateIds?: readonly string[] }>;
export interface CorrectionDetector { detect(input: CorrectionDetectionInput): CorrectionSignal | null; }
export type CorrectionTargetCandidate = Readonly<{ targetId: string; relevance: number; recency: number; directReference: boolean; rationale: string }>;
export type CorrectionTargetResolutionInput = Readonly<{ correctionId: string; candidates: readonly CorrectionTargetCandidate[]; errorType?: CorrectionErrorType; severity?: CorrectionSeverity; rationale: string; analyzedAt: string }>;
export interface CorrectionTargetResolver { resolve(input: CorrectionTargetResolutionInput): CorrectionAnalysis; }
export interface CorrectionRepository { append(record: CorrectionRecord): Promise<CorrectionRecord>; appendAnalysis(analysis: CorrectionAnalysis): Promise<CorrectionAnalysis>; appendImpact(impact: CorrectionDependencyImpact): Promise<CorrectionDependencyImpact>; appendCandidate(candidate: CorrectedKnowledgeCandidate): Promise<CorrectedKnowledgeCandidate>; appendPlan(plan: CorrectionRepairPlan): Promise<CorrectionRepairPlan>; appendRegressionCase(regressionCase: CorrectionRegressionCase): Promise<CorrectionRegressionCase>; appendRetest(retest: CorrectionRetestEvidence): Promise<CorrectionRetestEvidence>; appendRootCause(rootCause: CorrectionRootCauseAnalysis): Promise<CorrectionRootCauseAnalysis>; appendImprovementCandidate(candidate: SystemImprovementCandidate): Promise<SystemImprovementCandidate>; get(correctionId: string): Promise<CorrectionRecord | null>; list(): Promise<readonly CorrectionRecord[]>; }
export type CorrectionIntakeResult = Readonly<{ record: CorrectionRecord; duplicate: boolean; persistenceEffect: "CREATED" | "IDEMPOTENT_REPLAY"; authorityEffect: "UNCHANGED"; executionPermissionGranted: false }>;

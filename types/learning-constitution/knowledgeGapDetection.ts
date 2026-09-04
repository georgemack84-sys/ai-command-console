import type { ProvenanceActor } from "./provenance";

export const EPISTEMIC_STATES = ["KNOWN", "PARTIALLY_KNOWN", "UNCERTAIN", "CONFLICTING", "UNKNOWN", "UNTESTED"] as const;
export type EpistemicState = (typeof EPISTEMIC_STATES)[number];
export type KnowledgeGapSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL";
export type KnowledgeGapResolutionStrategy = "PROCEED" | "PROCEED_WITH_CAVEAT" | "RETRIEVE_MORE_EVIDENCE" | "ASK_TEACHER" | "GENERATE_PRACTICE" | "RUN_EVALUATION" | "INVOKE_CONFLICT_ENGINE" | "DEFER_DECISION" | "ESCALATE";
export type KnowledgeGapStatus = "DETECTED" | "OPEN" | "INVESTIGATING" | "RESOLUTION_CANDIDATE" | "VALIDATED" | "RESOLVED" | "DEFERRED" | "IRRELEVANT" | "SUPERSEDED" | "REOPENED";
export type KnowledgeGapRetrievalStatus = "COMPLETE" | "INCOMPLETE";
export type KnowledgeRequirement = Readonly<{ requirementId: string; subject: string; requiredDimensions: readonly string[]; scope: string; requiredFor: "DECISION_PREDICTION" | "SOCRATIC_MENTOR" | "PRACTICE" | "EVALUATION" | "GENERAL_REASONING"; importance: KnowledgeGapSeverity }>;
export type KnowledgeGapEvidence = Readonly<{ evidenceId: string; dimension: string; established: boolean; conflicting: boolean; interpretationCertain: boolean; validatedInScope: boolean; sourceId: string; summary: string }>;
/** Retrieval incompleteness is a condition, never a claim that the teacher has no knowledge. */
export type KnowledgeGap = Readonly<{ gapId: string; requirement: KnowledgeRequirement; currentState: EpistemicState; retrievalStatus: KnowledgeGapRetrievalStatus; coverage: Readonly<{ satisfiedDimensions: readonly string[]; missingDimensions: readonly string[] }>; confidence: number | null; existingEvidenceIds: readonly string[]; conflictingEvidenceIds: readonly string[]; relatedKnowledgeIds: readonly string[]; relatedSkillIds: readonly string[]; severity: KnowledgeGapSeverity; blocking: boolean; resolutionStrategy: KnowledgeGapResolutionStrategy; status: KnowledgeGapStatus; createdBy: ProvenanceActor; createdAt: string; lastEvaluatedAt: string; durableKnowledgeEffect: "NONE"; executionPermissionGranted: false }>;
export type KnowledgeGapLifecycleEvent = Readonly<{ gapId: string; previousStatus: KnowledgeGapStatus | null; nextStatus: KnowledgeGapStatus; reason: string; actor: ProvenanceActor; occurredAt: string }>;
export type KnowledgeGapPriority = Readonly<{ gapId: string; materiality: number; priority: number; rationale: string }>;
export type DecisionPredictionGapEligibility = Readonly<{ eligible: boolean; status: "ELIGIBLE" | "BLOCKED_BY_KNOWLEDGE_GAP" | "PROCEED_WITH_EXPOSED_LIMITATIONS"; blockingGapIds: readonly string[]; limitationGapIds: readonly string[] }>;
export type KnowledgeGapResolutionPlan = Readonly<{ planId: string; gapId: string; strategy: KnowledgeGapResolutionStrategy; actions: readonly string[]; status: "PROPOSED"; createdAt: string; createdBy: ProvenanceActor; durableKnowledgeEffect: "NONE"; executionPermissionGranted: false }>;
export type KnowledgeGapArtifactRecord = Readonly<{ artifactId: string; artifactType: "REQUIREMENT" | "GAP" | "REASSESSMENT" | "RESOLUTION_PLAN" | "LIFECYCLE" | "ANALYSIS"; subjectId: string; payload: unknown; createdAt: string }>;
export interface KnowledgeGapArtifactStore { append(artifact: KnowledgeGapArtifactRecord): Promise<KnowledgeGapArtifactRecord>; listArtifacts(subjectId: string): Promise<readonly KnowledgeGapArtifactRecord[]>; listWorkspaceArtifacts(): Promise<readonly KnowledgeGapArtifactRecord[]>; }

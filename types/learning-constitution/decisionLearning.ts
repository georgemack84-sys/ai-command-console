import type { KnowledgeScopeReference } from "./knowledgeScope";
import type { ProvenanceActor } from "./provenance";
export type DecisionOption = Readonly<{ optionId: string; description: string; disposition: "SELECTED" | "REJECTED" | "CONSIDERED"; rejectionReason?: string }>;
export type DecisionConstraint = Readonly<{ constraintId: string; description: string; kind: "HARD" | "SOFT"; provenanceId: string }>;
export type DecisionAssumption = Readonly<{ assumptionId: string; statement: string; challengeable: true; provenanceId: string }>;
/** A decision is contextual judgment evidence, not a reusable instruction, principle, or preference. */
export type DecisionCandidate = Readonly<{ decisionId: string; problem: string; context: string; scope: readonly KnowledgeScopeReference[]; constraints: readonly DecisionConstraint[]; assumptions: readonly DecisionAssumption[]; options: readonly DecisionOption[]; rationale: string; tradeoffs: readonly string[]; principleIds: readonly string[]; preferenceIds: readonly string[]; provenanceIds: readonly string[]; authority: "HUMAN_DECISION" | "AGENT_RECOMMENDATION"; status: "CANDIDATE"; significant: boolean; universalClaim: false; createdBy: ProvenanceActor; createdAt: string; immutable: true; executionPermissionGranted: false }>;
export type DecisionValidation = Readonly<{ decisionId: string; status: "VALID" | "DEFER" | "REJECT"; reasonCodes: readonly string[]; persistenceEffect: "NONE"; authorityEffect: "UNCHANGED"; executionPermissionGranted: false }>;
export interface DecisionValidator { validate(candidate: DecisionCandidate): DecisionValidation; }
export type DecisionArtifactRecord = Readonly<{ artifactId: string; artifactType: "CANDIDATE" | "VALIDATION" | "OUTCOME" | "REVISIT" | "SUPERSESSION"; subjectId: string; payload: unknown; createdAt: string }>;
export interface DecisionArtifactStore { append(artifact: DecisionArtifactRecord): Promise<DecisionArtifactRecord>; listArtifacts(subjectId: string): Promise<readonly DecisionArtifactRecord[]>; }
export type DecisionOutcome = Readonly<{ outcomeId: string; decisionId: string; result: "SUCCESS" | "PARTIAL" | "FAILURE" | "UNKNOWN"; observations: readonly string[]; recordedBy: ProvenanceActor; recordedAt: string; immutable: true; provesReasoningQuality: false }>;
export type DecisionRevisitRequest = Readonly<{ revisitId: string; decisionId: string; trigger: "ASSUMPTION_CHANGED" | "CONSTRAINT_CHANGED" | "OUTCOME_REVIEW"; reason: string; requestedBy: ProvenanceActor; requestedAt: string; immutable: true }>;
export type DecisionSimilarityResult = Readonly<{ decisionId: string; score: number; matchingContext: readonly string[]; mismatchReasons: readonly string[]; evidenceOnly: true }>;
export type DecisionSupersession = Readonly<{ supersessionId: string; priorDecisionId: string; successorDecisionId: string; reason: string; actor: ProvenanceActor; supersededAt: string; immutable: true }>;

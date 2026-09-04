import type { KnowledgeClassification } from "./constitutionalVocabulary";
import type { KnowledgeScopeReference } from "./knowledgeScope";
import type { ProvenanceActor } from "./provenance";

export const TEACH_BACK_REQUIREMENTS = ["NOT_REQUIRED", "OPTIONAL", "REQUIRED"] as const;
export type TeachBackRequirement = (typeof TEACH_BACK_REQUIREMENTS)[number];
export const TEACH_BACK_OUTCOMES = ["PASS", "PASS_WITH_UNCERTAINTY", "PARTIAL", "CLARIFICATION_REQUIRED", "FAIL"] as const;
export type TeachBackOutcome = (typeof TEACH_BACK_OUTCOMES)[number];

/** Generated comprehension artifact. It is evidence-only and not a knowledge/authority input type. */
export type TeachBack = Readonly<{
  teachBackId: string; lessonId: string; teachingEventId: string; candidateKnowledgeId: string; generatedAt: string; generatedBy: ProvenanceActor;
  lesson: string; rationale: string; scope: string; example: string; counterexample: string; uncertainties: readonly string[];
  status: "AWAITING_EVALUATION" | "EVALUATED"; immutable: true;
}>;
export type TeachBackEvaluationEvidence = Readonly<{ evidenceId: string; evidenceType: "TEACH_BACK_EVALUATION"; subjectId: string; teachBackId: string; evaluator: ProvenanceActor; outcome: TeachBackOutcome; dimensions: Readonly<Record<"fidelity" | "rationale" | "scope" | "generalization" | "exclusion" | "uncertainty" | "hallucination", "PASS" | "PARTIAL" | "FAIL">>; findings: readonly string[]; createdAt: string; provenanceRefs: readonly string[]; immutable: true }>;
export type TeachBackPolicyInput = Readonly<{ classification: KnowledgeClassification; scope?: KnowledgeScopeReference; securitySensitive?: boolean; constitutional?: boolean; conflictHistory?: boolean }>;
export interface TeachBackPolicy { evaluate(input: TeachBackPolicyInput): TeachBackRequirement; }
export type TeachBackStructuralValidation = Readonly<{ valid: boolean; violations: readonly string[]; persistenceEffect: "NONE"; authorityEffect: "UNCHANGED"; executionPermissionGranted: false }>;
export type TeachBackGenerationRequest = Readonly<{ teachBackId: string; lessonId: string; teachingEventId: string; candidateKnowledgeId: string; lesson: string; scope: string; sourceExamples: readonly string[]; generatedBy: ProvenanceActor }>;
export interface TeachBackGenerator { generate(request: TeachBackGenerationRequest): Promise<TeachBack>; }
export type TeachBackEvaluationInput = Readonly<{ teachBack: TeachBack; taughtLesson: string; expectedScope: string; sourceExamples: readonly string[]; evaluator: ProvenanceActor; now: string }>;
export interface TeachBackEvaluator { evaluate(input: TeachBackEvaluationInput): TeachBackEvaluationEvidence; }
export interface TeachBackRepository { append(teachBack: TeachBack): Promise<TeachBack>; appendEvaluation(evidence: TeachBackEvaluationEvidence): Promise<TeachBackEvaluationEvidence>; listByCandidateId(candidateKnowledgeId: string): Promise<readonly TeachBack[]>; listEvaluations(teachBackId: string): Promise<readonly TeachBackEvaluationEvidence[]>; }
export type TeachBackLifecycleResult = Readonly<{ teachBack: TeachBack; evidence: TeachBackEvaluationEvidence; persistenceEffect: "CREATED"; authorityEffect: "UNCHANGED"; executionPermissionGranted: false }>;
export type TeachBackHumanDecision = Readonly<{ decisionId: string; teachBackId: string; action: "APPROVE" | "APPROVE_WITH_CORRECTION" | "REQUEST_RETRY" | "CLARIFY" | "REJECT"; actor: ProvenanceActor; note: string; createdAt: string; immutable: true }>;
export interface TeachBackHumanDecisionRepository { append(decision: TeachBackHumanDecision): Promise<TeachBackHumanDecision>; list(teachBackId: string): Promise<readonly TeachBackHumanDecision[]>; }

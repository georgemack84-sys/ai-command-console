import type { ProvenanceActor } from "./provenance";
import type { PracticeTransferLevel } from "./practiceEngine";

export const EVALUATION_DIMENSIONS = ["CORRECTNESS", "APPLICATION", "GENERALIZATION", "BOUNDARY_RECOGNITION", "EXCEPTION_HANDLING", "CONSISTENCY", "CALIBRATION"] as const;
export type EvaluationDimension = (typeof EVALUATION_DIMENSIONS)[number];
export const EVALUATION_TYPES = ["DIAGNOSTIC", "PRACTICE", "TRANSFER", "BOUNDARY", "EXCEPTION", "ADVERSARIAL", "RETENTION", "CORRECTION", "MASTERY", "REGRESSION"] as const;
export type EvaluationType = (typeof EVALUATION_TYPES)[number];
export type EvaluationOutcome = "PASS" | "PARTIAL" | "FAIL" | "INVALID" | "NEEDS_REVIEW";
export type EvaluationLifecycleState = "CREATED" | "READY" | "RUNNING" | "SCORING" | "VALIDATING" | "COMPLETED";
export type EvaluationValidityStatus = "VALID" | "INVALID" | "QUESTIONABLE";
export type EvaluationEvaluatorType = "HUMAN_EVALUATOR" | "RULE_EVALUATOR" | "DETERMINISTIC_EVALUATOR" | "MODEL_EVALUATOR" | "REFERENCE_EVALUATOR" | "COMPOSITE_EVALUATOR";
export type EvaluationDimensionScores = Readonly<Record<EvaluationDimension, number>>;

/** Frozen before execution to prevent expected answers or hints leaking into the response context. */
export type EvaluationContext = Readonly<{
  contextId: string;
  allowedKnowledgeIds: readonly string[];
  hiddenReferenceIds: readonly string[];
  availableTools: readonly string[];
  providedHints: readonly string[];
  exposedExampleIds: readonly string[];
  environmentalConditions: readonly string[];
  frozenAt: string;
}>;
export type CompetenceEvaluationRubric = Readonly<{
  rubricId: string;
  skillId: string;
  version: string;
  dimensionThresholds: EvaluationDimensionScores;
  criticalDimensions: readonly EvaluationDimension[];
  requiredEvaluationTypes: readonly EvaluationType[];
  createdBy: ProvenanceActor;
  createdAt: string;
}>;
export type Evaluation = Readonly<{
  evaluationId: string;
  skillId: string;
  evaluationType: EvaluationType;
  trigger: "PRACTICE_ENGINE" | "HUMAN_REQUEST" | "REGRESSION_SCHEDULE" | "CORRECTION";
  difficulty: number;
  exerciseIds: readonly string[];
  expectedBehavior: readonly string[];
  actualBehavior: readonly string[];
  context: EvaluationContext;
  rubricId: string;
  rubricVersion: string;
  evaluator: Readonly<{ type: EvaluationEvaluatorType; actor: ProvenanceActor; version: string; independent: boolean }>;
  createdAt: string;
}>;
export type EvaluationResponse = Readonly<{ responseId: string; evaluationId: string; exerciseId: string; actualResponse: unknown; selfReportedConfidence: number | null; capturedAt: string }>;
export type EvaluationScore = Readonly<{ scoreId: string; evaluationId: string; dimensionScores: EvaluationDimensionScores; overallScore: number; outcome: EvaluationOutcome; scoredAt: string }>;
export const EVALUATION_FAILURE_CATEGORIES = ["KNOWLEDGE_GAP", "MISAPPLIED_RULE", "OVERGENERALIZATION", "UNDERGENERALIZATION", "BOUNDARY_FAILURE", "EXCEPTION_FAILURE", "DEPENDENCY_FAILURE", "INCONSISTENCY", "CALIBRATION_FAILURE", "REASONING_FAILURE", "EXECUTION_FAILURE", "AMBIGUITY_FAILURE"] as const;
export type EvaluationFailureCategory = (typeof EVALUATION_FAILURE_CATEGORIES)[number];
export type EvaluationFailure = Readonly<{ failureId: string; evaluationId: string; dimension: EvaluationDimension; category: EvaluationFailureCategory; relatedSkillId?: string; rationale: string; createdAt: string }>;
/** Measurements must come from a declared independent scoring method, never an unqualified self-rating. */
export type EvaluationDimensionMeasurement = Readonly<{ dimension: EvaluationDimension; score: number; scoringMethod: "EXACT_MATCH" | "STRUCTURAL_MATCH" | "SEMANTIC_MATCH" | "CONSTRAINT_SATISFACTION" | "RUBRIC_BASED" | "HUMAN_JUDGMENT"; rationale: string; relatedSkillId?: string }>;
export type EvaluationScoringResult = Readonly<{ score: EvaluationScore; failures: readonly EvaluationFailure[]; criticalDimensionsFailed: readonly EvaluationDimension[]; outcomeReason: string }>;
export type EvaluationValidity = Readonly<{ validityId: string; evaluationId: string; status: EvaluationValidityStatus; reasonCodes: readonly string[]; checkedAt: string }>;
/** Retained evaluation evidence is capability evidence, never a durable-knowledge candidate. */
export type EvaluationEvidence = Readonly<{ evidenceId: string; evaluationId: string; skillId: string; exerciseIds: readonly string[]; responseIds: readonly string[]; scoreId: string; validityId: string; evaluator: Evaluation["evaluator"]; createdAt: string; skillRegistryEffect: "EVIDENCE_ONLY"; durableKnowledgeEffect: "NONE"; executionPermissionGranted: false }>;
export type EvaluationObservation = Readonly<{ evaluation: Evaluation; response: EvaluationResponse; score: EvaluationScore; validity: EvaluationValidity; contextKey: string; transferLevel?: PracticeTransferLevel }>;
export type EvaluationCalibrationAnalysis = Readonly<{ sampleSize: number; meanConfidence: number | null; meanObservedScore: number | null; meanAbsoluteError: number | null; state: "INSUFFICIENT_EVIDENCE" | "WELL_CALIBRATED" | "OVERCONFIDENT" | "UNDERCONFIDENT" }>;
export type EvaluationConsistencyAnalysis = Readonly<{ sampleSize: number; meanScore: number | null; scoreRange: number | null; contextCount: number; difficultyRange: number | null; state: "INSUFFICIENT_EVIDENCE" | "CONSISTENT" | "VARIABLE" }>;
export type EvaluationTransferProfile = Readonly<Record<PracticeTransferLevel, Readonly<{ sampleSize: number; meanScore: number | null }>>>;
export type EvaluationRecencyState = "CURRENT" | "AGING" | "STALE" | "REVALIDATION_REQUIRED" | "NO_VALID_EVIDENCE";
export type EvaluationAnalysis = Readonly<{ analysisId: string; skillId: string; calibration: EvaluationCalibrationAnalysis; consistency: EvaluationConsistencyAnalysis; transfer: EvaluationTransferProfile; lastValidEvidenceAt: string | null; recency: EvaluationRecencyState; analyzedAt: string; masteryEffect: "NONE"; durableKnowledgeEffect: "NONE"; executionPermissionGranted: false }>;
export type EvaluationCompetenceAssessment = Readonly<{ assessmentId: string; skillId: string; status: "INSUFFICIENT_EVIDENCE" | "DEVELOPING" | "SUPPORTED" | "MASTERY_CANDIDATE" | "REVALIDATION_REQUIRED"; eligibleForMasteryReview: boolean; dimensionAverages: EvaluationDimensionScores; requiredEvaluationTypesMissing: readonly EvaluationType[]; supportingEvidenceIds: readonly string[]; reasons: readonly string[]; analyzedAt: string; masteryEffect: "NONE"; durableKnowledgeEffect: "NONE"; executionPermissionGranted: false }>;
export type EvaluationLifecycleEvent = Readonly<{ evaluationId: string; previousState: EvaluationLifecycleState | null; nextState: EvaluationLifecycleState; occurredAt: string; actor: ProvenanceActor }>;
export type EvaluationArtifactRecord = Readonly<{ artifactId: string; artifactType: "RUBRIC" | "EVALUATION" | "RESPONSE" | "SCORE" | "FAILURE" | "VALIDITY" | "EVIDENCE" | "ANALYSIS" | "ASSESSMENT" | "LIFECYCLE"; subjectId: string; payload: unknown; createdAt: string }>;
export interface EvaluationArtifactStore { append(artifact: EvaluationArtifactRecord): Promise<EvaluationArtifactRecord>; listArtifacts(subjectId: string): Promise<readonly EvaluationArtifactRecord[]>; listWorkspaceArtifacts(): Promise<readonly EvaluationArtifactRecord[]>; }

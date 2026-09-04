import type { ProvenanceActor } from "./provenance";

export const PRACTICE_TRANSFER_LEVELS = ["EXACT", "MODIFIED", "NOVEL", "AMBIGUOUS", "EDGE", "ADVERSARIAL"] as const;
export type PracticeTransferLevel = (typeof PRACTICE_TRANSFER_LEVELS)[number];
export const PRACTICE_EXERCISE_SOURCES = ["AGENT_GENERATED", "HUMAN_GENERATED", "IMPORTED", "BENCHMARK", "REGRESSION"] as const;
export type PracticeExerciseSource = (typeof PRACTICE_EXERCISE_SOURCES)[number];
export const PRACTICE_EXERCISE_STATES = ["GENERATED", "VALIDATED", "ASSIGNED", "ATTEMPTED", "EVALUATED", "REMEDIATION_REQUIRED", "RETEST", "ARCHIVED"] as const;
export type PracticeExerciseState = (typeof PRACTICE_EXERCISE_STATES)[number];
export const PRACTICE_OUTCOMES = ["PASS", "PARTIAL", "FAIL", "CLARIFICATION_VALID"] as const;
export type PracticeOutcome = (typeof PRACTICE_OUTCOMES)[number];
export const PRACTICE_FAILURE_TYPES = ["RECALL_FAILURE", "COMPREHENSION_FAILURE", "APPLICATION_FAILURE", "TRANSFER_FAILURE", "SCOPE_FAILURE", "DEPENDENCY_FAILURE", "EXCEPTION_FAILURE", "AMBIGUITY_FAILURE", "JUDGMENT_FAILURE", "AUTHORITY_FAILURE", "ADVERSARIAL_FAILURE"] as const;
export type PracticeFailureType = (typeof PRACTICE_FAILURE_TYPES)[number];

export type PracticeLineage = Readonly<{
  targetSkillIds: readonly string[];
  knowledgeIds: readonly string[];
  procedureIds: readonly string[];
  principleIds: readonly string[];
  exampleIds: readonly string[];
  sourceSnapshotId: string;
}>;

export type PracticeScenarioFeatures = Readonly<{
  domain: string;
  ambiguityPresent: boolean;
  edgeConditionPresent: boolean;
  adversarialPressurePresent: boolean;
}>;
export type PracticeSimilarityProfile = Readonly<{
  structuralFingerprint: string;
  solutionFingerprint: string;
  languageFingerprint: string;
}>;

/** Prompt-visible exercise content. Hidden evaluation criteria are deliberately excluded. */
export type PracticeExercise = Readonly<{
  exerciseId: string;
  state: PracticeExerciseState;
  source: PracticeExerciseSource;
  targetSkillIds: readonly string[];
  prerequisiteSkillIds: readonly string[];
  difficulty: number;
  transferLevel: PracticeTransferLevel;
  transferDistance: number;
  scenario: string;
  instructions: string;
  constraints: readonly string[];
  expectedCompetencies: readonly string[];
  visibleEvaluationCriteria: readonly string[];
  hiddenCriteriaCount: number;
  hiddenChallengeCount: number;
  scenarioFeatures: PracticeScenarioFeatures;
  similarity: PracticeSimilarityProfile;
  lineage: PracticeLineage;
  generation: Readonly<{ generatorVersion: string; configVersion: string; generatedAt: string; generatedBy: ProvenanceActor }>;
}>;

/** Evaluator-only material; never pass this object to the actor attempting the exercise. */
export type PracticeEvaluationSpec = Readonly<{
  exerciseId: string;
  rubricVersion: string;
  hiddenCriteria: readonly string[];
  hiddenChallenges: readonly string[];
}>;

export type PracticeAttempt = Readonly<{
  attemptId: string;
  exerciseId: string;
  learnerId: string;
  response: unknown;
  submittedAt: string;
  responseConfidence: number | null;
}>;

export type PracticeEvaluation = Readonly<{
  evaluationId: string;
  attemptId: string;
  exerciseId: string;
  outcome: PracticeOutcome;
  score: number;
  failureTypes: readonly PracticeFailureType[];
  matchedCriteria: readonly string[];
  missedCriteria: readonly string[];
  evaluator: ProvenanceActor;
  evaluatedAt: string;
  rubricVersion: string;
}>;

export type PracticeComponentEvaluation = Readonly<{
  skillId: string;
  outcome: PracticeOutcome;
  score: number;
  failureTypes: readonly PracticeFailureType[];
  rationale: string;
}>;
export type PracticeEvaluationResult = Readonly<{
  evaluation: PracticeEvaluation;
  components: readonly PracticeComponentEvaluation[];
}>;
export type PracticeAdaptation = Readonly<{
  action: "INCREASE_TRANSFER" | "MAINTAIN" | "REDUCE_DIFFICULTY" | "REMEDIATE";
  recommendedDifficulty: number;
  recommendedTransferLevel: PracticeTransferLevel;
  remediationRequired: boolean;
  reason: string;
  masteryEffect: "NONE";
}>;

export type PracticeEvidenceStrength = "WEAK" | "LIMITED" | "MODERATE" | "STRONG" | "VERY_STRONG";
/** Evidence can be submitted to the Skill Registry, but cannot itself set mastery or durable knowledge. */
export type PracticeEvidence = Readonly<{
  evidenceId: string;
  skillId: string;
  exerciseId: string;
  attemptId: string;
  evaluationId: string;
  transferLevel: PracticeTransferLevel;
  difficulty: number;
  transferDistance: number;
  outcome: PracticeOutcome;
  score: number;
  strength: PracticeEvidenceStrength;
  createdAt: string;
  skillRegistryEffect: "EVIDENCE_ONLY";
  durableKnowledgeEffect: "NONE";
  executionPermissionGranted: false;
}>;

export type PracticeValidation = Readonly<{
  valid: boolean;
  reasonCodes: readonly string[];
  durableKnowledgeEffect: "NONE";
  executionPermissionGranted: false;
}>;

export type PracticeSession = Readonly<{
  sessionId: string;
  targetSkillIds: readonly string[];
  startingDifficulty: number;
  transferStrategy: readonly PracticeTransferLevel[];
  exerciseIds: readonly string[];
  state: "PLANNED" | "ACTIVE" | "COMPLETED" | "ABANDONED";
  createdBy: ProvenanceActor;
  createdAt: string;
}>;

/** Immutable link from a diagnosed failure to the focused exercise prescribed before retest. */
export type PracticeRemediation = Readonly<{
  remediationId: string;
  failedExerciseId: string;
  failedEvaluationId: string;
  targetSkillId: string;
  remediationExerciseId: string;
  skillGraphPlanId?: string;
  createdBy: ProvenanceActor;
  createdAt: string;
}>;
/** Completion is distinct from assignment so a retest cannot be silently enabled. */
export type PracticeRemediationCompletion = Readonly<{
  remediationId: string;
  remediationAttemptId: string;
  completedBy: ProvenanceActor;
  completedAt: string;
}>;
export type PracticeRetestLink = Readonly<{
  retestId: string;
  remediationId: string;
  originalExerciseId: string;
  retestExerciseId: string;
  sourceSnapshotId: string;
  authorizedBy: ProvenanceActor;
  authorizedAt: string;
}>;

export type PracticeArtifactRecord = Readonly<{
  artifactId: string;
  artifactType: "EXERCISE" | "EVALUATION_SPEC" | "SESSION" | "ATTEMPT" | "EVALUATION" | "EVALUATION_COMPONENT" | "EVIDENCE" | "LIFECYCLE" | "REMEDIATION" | "REMEDIATION_COMPLETION" | "RETEST_LINK" | "LINEAGE_BINDING";
  subjectId: string;
  payload: unknown;
  createdAt: string;
}>;
/** Append-only practice history; projections may be rebuilt from these artifacts. */
export interface PracticeArtifactStore {
  append(artifact: PracticeArtifactRecord): Promise<PracticeArtifactRecord>;
  listArtifacts(subjectId: string): Promise<readonly PracticeArtifactRecord[]>;
  listWorkspaceArtifacts(): Promise<readonly PracticeArtifactRecord[]>;
}

export type PracticeExerciseGenerationRequest = Readonly<{
  exerciseId: string;
  source: PracticeExerciseSource;
  targetSkillIds: readonly string[];
  prerequisiteSkillIds: readonly string[];
  difficulty: number;
  transferLevel: PracticeTransferLevel;
  scenario: string;
  instructions: string;
  constraints: readonly string[];
  expectedCompetencies: readonly string[];
  visibleEvaluationCriteria: readonly string[];
  hiddenCriteria: readonly string[];
  hiddenChallenges: readonly string[];
  scenarioFeatures: PracticeScenarioFeatures;
  similarity: PracticeSimilarityProfile;
  lineage: PracticeLineage;
  generation: PracticeExercise["generation"];
}>;
export type PracticeSimilarityResult = Readonly<{
  tooSimilar: boolean;
  score: number;
  scenarioSimilarity: number;
  domainSimilarity: number;
  structuralSimilarity: number;
  solutionSimilarity: number;
  languageSimilarity: number;
}>;

export type PracticeRecommendation = Readonly<{
  skillId: string;
  recommendedSkillId: string;
  transferLevel: PracticeTransferLevel;
  reason: string;
  source: "TRANSFER_PROGRESS" | "PREREQUISITE_REMEDIATION";
}>;
export type PracticeRegressionDue = Readonly<{
  skillId: string;
  dueAt: string;
  lastPracticedAt: string | null;
  reason: string;
}>;

export interface PracticeAuthoritativeSourceResolver {
  knowledgeIdsFor(skillId: string): Promise<readonly string[]>;
  exampleIdsFor(skillId: string): Promise<readonly string[]>;
}
export type PracticeLineageRetrieval = Readonly<{
  lineage: PracticeLineage;
  prerequisiteSkillIds: readonly string[];
  sourceSkillIds: readonly string[];
}>;

export type PracticeSourceKind = "KNOWLEDGE" | "PROCEDURE" | "PRINCIPLE" | "EXAMPLE";
export type PracticeSourceBinding = Readonly<{
  bindingId: string;
  skillId: string;
  sourceKind: PracticeSourceKind;
  sourceId: string;
  sourceSnapshotId: string;
  status: "ACTIVE" | "SUPERSEDED";
  provenanceId: string;
  boundBy: ProvenanceActor;
  boundAt: string;
}>;
export interface PracticeSourceAuthorityVerifier { verify(sourceKind: PracticeSourceKind, sourceId: string): Promise<boolean>; }

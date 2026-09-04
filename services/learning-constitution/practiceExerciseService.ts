import type { PracticeComponentEvaluation, PracticeEvidence, PracticeEvaluation, PracticeEvaluationSpec, PracticeExercise, PracticeExerciseState, PracticeTransferLevel, PracticeValidation } from "../../types/learning-constitution/practiceEngine";

const distanceFor: Record<PracticeTransferLevel, number> = { EXACT: 0, MODIFIED: 1, NOVEL: 3, AMBIGUOUS: 4, EDGE: 5, ADVERSARIAL: 6 };
const strengthFor: Record<PracticeTransferLevel, PracticeEvidence["strength"]> = { EXACT: "WEAK", MODIFIED: "LIMITED", NOVEL: "MODERATE", AMBIGUOUS: "STRONG", EDGE: "STRONG", ADVERSARIAL: "VERY_STRONG" };
const transitions: Readonly<Record<PracticeExerciseState, readonly PracticeExerciseState[]>> = {
  GENERATED: ["VALIDATED"], VALIDATED: ["ASSIGNED", "ARCHIVED"], ASSIGNED: ["ATTEMPTED", "ARCHIVED"], ATTEMPTED: ["EVALUATED"], EVALUATED: ["REMEDIATION_REQUIRED", "RETEST", "ARCHIVED"], REMEDIATION_REQUIRED: ["RETEST", "ARCHIVED"], RETEST: ["ASSIGNED", "ARCHIVED"], ARCHIVED: [],
};

/** Phase 20 boundary checks. Practice records are evidence-producing only. */
export class PracticeExerciseValidator {
  validate(exercise: PracticeExercise, evaluationSpec?: PracticeEvaluationSpec): PracticeValidation {
    const reasonCodes: string[] = [];
    if (!exercise.exerciseId.trim() || !exercise.targetSkillIds.length || !exercise.lineage.sourceSnapshotId.trim()) reasonCodes.push("EXERCISE_IDENTITY_AND_LINEAGE_REQUIRED");
    if (!exercise.scenario.trim() || !exercise.instructions.trim() || !exercise.expectedCompetencies.length) reasonCodes.push("EXERCISE_CONTENT_REQUIRED");
    if (!Number.isFinite(exercise.difficulty) || exercise.difficulty < 0 || exercise.difficulty > 1) reasonCodes.push("DIFFICULTY_INVALID");
    if (exercise.transferDistance !== distanceFor[exercise.transferLevel]) reasonCodes.push("TRANSFER_DISTANCE_INCONSISTENT");
    if (exercise.hiddenCriteriaCount < 0 || exercise.hiddenChallengeCount < 0) reasonCodes.push("HIDDEN_CRITERIA_COUNT_INVALID");
    if (evaluationSpec && (evaluationSpec.exerciseId !== exercise.exerciseId || evaluationSpec.hiddenCriteria.length !== exercise.hiddenCriteriaCount || evaluationSpec.hiddenChallenges.length !== exercise.hiddenChallengeCount)) reasonCodes.push("EVALUATION_SPEC_INCONSISTENT");
    return { valid: reasonCodes.length === 0, reasonCodes: reasonCodes.length ? reasonCodes : ["PRACTICE_EXERCISE_VALID"], durableKnowledgeEffect: "NONE", executionPermissionGranted: false };
  }
}

export class PracticeExerciseLifecycleService {
  transition(exercise: PracticeExercise, nextState: PracticeExerciseState): PracticeExercise {
    if (!transitions[exercise.state].includes(nextState)) throw new Error(`invalid practice lifecycle transition: ${exercise.state} -> ${nextState}`);
    return { ...exercise, state: nextState };
  }
}

/** Converts a completed evaluation to registry-consumable evidence without making a skill claim. */
export class PracticeEvidenceService {
  create(exercise: PracticeExercise, evaluation: PracticeEvaluation, evidenceId: string): PracticeEvidence {
    if (evaluation.exerciseId !== exercise.exerciseId || !evidenceId.trim()) throw new Error("practice evidence requires a matching exercise evaluation");
    return { evidenceId, skillId: exercise.targetSkillIds[0]!, exerciseId: exercise.exerciseId, attemptId: evaluation.attemptId, evaluationId: evaluation.evaluationId, transferLevel: exercise.transferLevel, difficulty: exercise.difficulty, transferDistance: exercise.transferDistance, outcome: evaluation.outcome, score: evaluation.score, strength: strengthFor[exercise.transferLevel], createdAt: evaluation.evaluatedAt, skillRegistryEffect: "EVIDENCE_ONLY", durableKnowledgeEffect: "NONE", executionPermissionGranted: false };
  }
  createForComponents(exercise: PracticeExercise, evaluation: PracticeEvaluation, components: readonly PracticeComponentEvaluation[]): readonly PracticeEvidence[] {
    if (exercise.targetSkillIds.length === 1 && !components.length) return [this.create(exercise, evaluation, `practice:${evaluation.evaluationId}`)];
    const bySkill = new Map(components.map((component) => [component.skillId, component]));
    return exercise.targetSkillIds.map((skillId) => {
      const component = bySkill.get(skillId);
      if (!component) throw new Error(`practice evidence requires a component evaluation for ${skillId}`);
      return { evidenceId: `practice:${evaluation.evaluationId}:${skillId}`, skillId, exerciseId: exercise.exerciseId, attemptId: evaluation.attemptId, evaluationId: evaluation.evaluationId, transferLevel: exercise.transferLevel, difficulty: exercise.difficulty, transferDistance: exercise.transferDistance, outcome: component.outcome, score: component.score, strength: strengthFor[exercise.transferLevel], createdAt: evaluation.evaluatedAt, skillRegistryEffect: "EVIDENCE_ONLY", durableKnowledgeEffect: "NONE", executionPermissionGranted: false };
    });
  }
}

const tokens = (value: string): ReadonlySet<string> => new Set(value.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2));
const jaccard = (left: ReadonlySet<string>, right: ReadonlySet<string>): number => { const union = new Set([...left, ...right]); if (!union.size) return 1; return [...left].filter((token) => right.has(token)).length / union.size; };

/** Prevents a practice progression from repeatedly testing the same surface pattern. */
export class PracticeSimilarityService {
  compare(candidate: PracticeExercise, prior: PracticeExercise, threshold = 0.75): import("../../types/learning-constitution/practiceEngine").PracticeSimilarityResult {
    const scenarioSimilarity = jaccard(tokens(candidate.scenario), tokens(prior.scenario));
    const domainSimilarity = candidate.scenarioFeatures.domain === prior.scenarioFeatures.domain ? 1 : 0;
    const structuralSimilarity = candidate.similarity.structuralFingerprint === prior.similarity.structuralFingerprint ? 1 : 0;
    const solutionSimilarity = candidate.similarity.solutionFingerprint === prior.similarity.solutionFingerprint ? 1 : 0;
    const languageSimilarity = candidate.similarity.languageFingerprint === prior.similarity.languageFingerprint ? 1 : 0;
    const score = Number((scenarioSimilarity * 0.3 + domainSimilarity * 0.15 + structuralSimilarity * 0.25 + solutionSimilarity * 0.2 + languageSimilarity * 0.1).toFixed(4));
    return { tooSimilar: score >= threshold, score, scenarioSimilarity, domainSimilarity, structuralSimilarity, solutionSimilarity, languageSimilarity };
  }
}

/** Builds only an evidenced exercise candidate. A configured model may supply the draft, but this service admits no new knowledge. */
export class PracticeExerciseGenerationService {
  constructor(private readonly validator = new PracticeExerciseValidator(), private readonly similarity = new PracticeSimilarityService()) {}
  generate(request: import("../../types/learning-constitution/practiceEngine").PracticeExerciseGenerationRequest, priorExercises: readonly PracticeExercise[], similarityThreshold = 0.75): Readonly<{ exercise: PracticeExercise; evaluationSpec: PracticeEvaluationSpec }> {
    const transferDistance = distanceFor[request.transferLevel];
    const exercise: PracticeExercise = { exerciseId: request.exerciseId, state: "GENERATED", source: request.source, targetSkillIds: request.targetSkillIds, prerequisiteSkillIds: request.prerequisiteSkillIds, difficulty: request.difficulty, transferLevel: request.transferLevel, transferDistance, scenario: request.scenario, instructions: request.instructions, constraints: request.constraints, expectedCompetencies: request.expectedCompetencies, visibleEvaluationCriteria: request.visibleEvaluationCriteria, hiddenCriteriaCount: request.hiddenCriteria.length, hiddenChallengeCount: request.hiddenChallenges.length, scenarioFeatures: request.scenarioFeatures, similarity: request.similarity, lineage: request.lineage, generation: request.generation };
    const spec: PracticeEvaluationSpec = { exerciseId: exercise.exerciseId, rubricVersion: request.generation.configVersion, hiddenCriteria: request.hiddenCriteria, hiddenChallenges: request.hiddenChallenges };
    const validation = this.validator.validate(exercise, spec);
    if (!validation.valid) throw new Error(`invalid generated practice exercise: ${validation.reasonCodes.join(", ")}`);
    if (exercise.transferLevel === "AMBIGUOUS" && !exercise.scenarioFeatures.ambiguityPresent) throw new Error("ambiguous exercise requires genuine ambiguity");
    if (exercise.transferLevel === "EDGE" && !exercise.scenarioFeatures.edgeConditionPresent) throw new Error("edge exercise requires a boundary condition");
    if (exercise.transferLevel === "ADVERSARIAL" && !exercise.scenarioFeatures.adversarialPressurePresent) throw new Error("adversarial exercise requires legitimate misleading pressure");
    if (!exercise.lineage.knowledgeIds.length && !exercise.lineage.procedureIds.length && !exercise.lineage.principleIds.length && !exercise.lineage.exampleIds.length) throw new Error("exercise requires authoritative source lineage");
    if (priorExercises.some((prior) => this.similarity.compare(exercise, prior, similarityThreshold).tooSimilar)) throw new Error("exercise similarity exceeds the allowed threshold; regenerate");
    return { exercise, evaluationSpec: spec };
  }
}

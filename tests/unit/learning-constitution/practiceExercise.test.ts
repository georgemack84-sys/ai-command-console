import { describe, expect, it } from "vitest";
import { PracticeEvidenceService, PracticeExerciseGenerationService, PracticeExerciseLifecycleService, PracticeExerciseValidator } from "@/services/learning-constitution";
import type { PracticeEvaluation, PracticeEvaluationSpec, PracticeExercise } from "@/types/learning-constitution";

const exercise = (overrides: Partial<PracticeExercise> = {}): PracticeExercise => ({ exerciseId: "PE-0041", state: "GENERATED", source: "AGENT_GENERATED", targetSkillIds: ["SK-ROADMAP"], prerequisiteSkillIds: ["SK-DEPENDENCY"], difficulty: 0.72, transferLevel: "NOVEL", transferDistance: 3, scenario: "A manufacturing workflow must be decomposed into implementation phases.", instructions: "Propose a dependency-aware roadmap.", constraints: ["State assumptions."], expectedCompetencies: ["Identify dependencies."], visibleEvaluationCriteria: ["Provide a rationale."], hiddenCriteriaCount: 2, hiddenChallengeCount: 1, scenarioFeatures: { domain: "manufacturing", ambiguityPresent: false, edgeConditionPresent: false, adversarialPressurePresent: false }, similarity: { structuralFingerprint: "dependency-chain", solutionFingerprint: "sequenced-roadmap", languageFingerprint: "manufacturing-v1" }, lineage: { targetSkillIds: ["SK-ROADMAP"], knowledgeIds: ["K-1"], procedureIds: ["PX-1"], principleIds: ["P-1"], exampleIds: ["EX-1"], sourceSnapshotId: "snapshot:1" }, generation: { generatorVersion: "20.0", configVersion: "20.0", generatedAt: "2026-09-01T00:00:00.000Z", generatedBy: { actorId: "agent:noesis", actorType: "AGENT" } }, ...overrides });
const evaluation = (overrides: Partial<PracticeEvaluation> = {}): PracticeEvaluation => ({ evaluationId: "PEV-1", attemptId: "PA-1", exerciseId: "PE-0041", outcome: "PASS", score: 0.88, failureTypes: [], matchedCriteria: ["dependency identified"], missedCriteria: [], evaluator: { actorId: "human:teacher", actorType: "HUMAN" }, evaluatedAt: "2026-09-01T00:01:00.000Z", rubricVersion: "1", ...overrides });

describe("Phase 20 practice foundation", () => {
  it("keeps difficulty and transfer distance independent while validating hidden evaluation material separately", () => {
    const exactHighDifficulty = exercise({ transferLevel: "EXACT", transferDistance: 0, difficulty: 0.95 });
    const novelLowDifficulty = exercise({ transferLevel: "NOVEL", transferDistance: 3, difficulty: 0.2 });
    const spec: PracticeEvaluationSpec = { exerciseId: exactHighDifficulty.exerciseId, rubricVersion: "1", hiddenCriteria: ["missing dependency", "scope preserved"], hiddenChallenges: ["misleading request"] };
    expect(new PracticeExerciseValidator().validate(exactHighDifficulty, spec)).toMatchObject({ valid: true, durableKnowledgeEffect: "NONE" });
    expect(new PracticeExerciseValidator().validate(novelLowDifficulty)).toMatchObject({ valid: true });
    expect(exactHighDifficulty).not.toHaveProperty("hiddenCriteria");
  });
  it("does not let exact success imply mastery or durable knowledge", () => {
    const exact = exercise({ transferLevel: "EXACT", transferDistance: 0 });
    const evidence = new PracticeEvidenceService().create(exact, evaluation(), "EV-PRACTICE-1");
    expect(evidence).toMatchObject({ strength: "WEAK", skillRegistryEffect: "EVIDENCE_ONLY", durableKnowledgeEffect: "NONE", executionPermissionGranted: false });
  });
  it("enforces the exercise lifecycle", () => {
    const lifecycle = new PracticeExerciseLifecycleService();
    expect(lifecycle.transition(exercise(), "VALIDATED")).toMatchObject({ state: "VALIDATED" });
    expect(() => lifecycle.transition(exercise(), "EVALUATED")).toThrow("invalid practice lifecycle transition");
  });
  it("requires transfer-specific structure, authoritative lineage, and regeneration for overly similar exercises", () => {
    const generator = new PracticeExerciseGenerationService(); const prior = exercise();
    const request = { ...prior, exerciseId: "PE-0042", hiddenCriteria: ["missing dependency", "scope preserved"], hiddenChallenges: ["misleading request"], generation: prior.generation };
    expect(() => generator.generate({ ...request, transferLevel: "ADVERSARIAL", scenarioFeatures: { ...prior.scenarioFeatures, adversarialPressurePresent: false } }, [])).toThrow("legitimate misleading pressure");
    expect(() => generator.generate(request, [prior])).toThrow("similarity exceeds");
    expect(generator.generate({ ...request, scenario: "A hospital logistics program needs a staged rollout.", scenarioFeatures: { domain: "health logistics", ambiguityPresent: false, edgeConditionPresent: false, adversarialPressurePresent: false }, similarity: { structuralFingerprint: "risk-gated-rollout", solutionFingerprint: "alternative-sequencing", languageFingerprint: "hospital-v1" } }, [prior])).toMatchObject({ exercise: { exerciseId: "PE-0042", transferDistance: 3 }, evaluationSpec: { hiddenCriteria: ["missing dependency", "scope preserved"] } });
  });
});

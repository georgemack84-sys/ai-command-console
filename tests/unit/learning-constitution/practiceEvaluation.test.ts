import { describe, expect, it } from "vitest";
import { PracticeAdaptiveProgressionService, PracticeEvaluationValidator, PracticeFailureClassificationService } from "@/services/learning-constitution";
import type { PracticeEvaluationResult, PracticeExercise } from "@/types/learning-constitution";

const exercise = (overrides: Partial<PracticeExercise> = {}): PracticeExercise => ({ exerciseId: "PE-1", state: "ATTEMPTED", source: "AGENT_GENERATED", targetSkillIds: ["SK-ROADMAP"], prerequisiteSkillIds: [], difficulty: 0.6, transferLevel: "NOVEL", transferDistance: 3, scenario: "A new domain needs sequencing.", instructions: "Propose a plan.", constraints: [], expectedCompetencies: ["dependency analysis"], visibleEvaluationCriteria: ["rationale"], hiddenCriteriaCount: 0, hiddenChallengeCount: 0, scenarioFeatures: { domain: "logistics", ambiguityPresent: false, edgeConditionPresent: false, adversarialPressurePresent: false }, similarity: { structuralFingerprint: "sequence", solutionFingerprint: "roadmap", languageFingerprint: "v1" }, lineage: { targetSkillIds: ["SK-ROADMAP"], knowledgeIds: ["K-1"], procedureIds: [], principleIds: [], exampleIds: [], sourceSnapshotId: "snapshot:1" }, generation: { generatorVersion: "20", configVersion: "20", generatedAt: "2026-09-01T00:00:00.000Z", generatedBy: { actorId: "agent:noesis", actorType: "AGENT" } }, ...overrides });
const result = (overrides: Partial<PracticeEvaluationResult["evaluation"]> = {}): PracticeEvaluationResult => ({ evaluation: { evaluationId: "PVE-1", attemptId: "PA-1", exerciseId: "PE-1", outcome: "PASS", score: 0.9, failureTypes: [], matchedCriteria: [], missedCriteria: [], evaluator: { actorId: "human:teacher", actorType: "HUMAN" }, evaluatedAt: "2026-09-01T00:01:00.000Z", rubricVersion: "1", ...overrides }, components: [] });

describe("Phase 20 adaptive practice", () => {
  it("treats a valid clarification as judgment, not a failure", () => {
    const ambiguous = exercise({ transferLevel: "AMBIGUOUS", transferDistance: 4, scenarioFeatures: { ...exercise().scenarioFeatures, ambiguityPresent: true } });
    const clarification = result({ outcome: "CLARIFICATION_VALID", score: 1 });
    expect(new PracticeEvaluationValidator().validate(ambiguous, clarification)).toMatchObject({ valid: true, masteryEffect: "NONE" });
    expect(new PracticeAdaptiveProgressionService().recommend(ambiguous, clarification)).toMatchObject({ action: "MAINTAIN", remediationRequired: false });
  });
  it("requires diagnostic failure types and conservatively routes failure to remediation", () => {
    const failed = result({ outcome: "FAIL", score: 0.2, failureTypes: ["TRANSFER_FAILURE"] });
    expect(new PracticeEvaluationValidator().validate(exercise(), failed)).toMatchObject({ valid: true });
    expect(new PracticeAdaptiveProgressionService().recommend(exercise(), failed)).toMatchObject({ action: "REMEDIATE", remediationRequired: true, masteryEffect: "NONE" });
    expect(new PracticeFailureClassificationService().classify({ assertedFailureTypes: ["TRANSFER_FAILURE"], supportingObservations: ["Pattern was not recognized outside the taught domain."] })).toEqual(["TRANSFER_FAILURE"]);
  });
  it("requires component evidence for cross-skill exercises and increases transfer only modestly", () => {
    const integrated = exercise({ targetSkillIds: ["SK-DEPENDENCY", "SK-ROADMAP"] });
    expect(new PracticeEvaluationValidator().validate(integrated, result())).toMatchObject({ valid: false, reasonCodes: expect.arrayContaining(["CROSS_SKILL_COMPONENT_EVALUATION_REQUIRED"]) });
    expect(new PracticeAdaptiveProgressionService().recommend(exercise(), result())).toMatchObject({ action: "INCREASE_TRANSFER", recommendedTransferLevel: "AMBIGUOUS", recommendedDifficulty: 0.65 });
  });
});

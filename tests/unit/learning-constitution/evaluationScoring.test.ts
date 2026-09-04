import { describe, expect, it } from "vitest";
import { EvaluationRubricEngine } from "@/services/learning-constitution";
import type { CompetenceEvaluationRubric, Evaluation, EvaluationDimensionMeasurement } from "@/types/learning-constitution";

const actor = { actorId: "human:teacher", actorType: "HUMAN" as const }; const stamp = "2026-09-02T02:00:00.000Z";
const thresholds = { CORRECTNESS: 0.9, APPLICATION: 0.85, GENERALIZATION: 0.8, BOUNDARY_RECOGNITION: 0.85, EXCEPTION_HANDLING: 0.75, CONSISTENCY: 0.85, CALIBRATION: 0.8 } as const;
const rubric: CompetenceEvaluationRubric = { rubricId: "ER-ROADMAP", skillId: "SK-ROADMAP", version: "1", dimensionThresholds: thresholds, criticalDimensions: ["CORRECTNESS", "BOUNDARY_RECOGNITION"], requiredEvaluationTypes: ["TRANSFER", "BOUNDARY"], createdBy: actor, createdAt: stamp };
const evaluation: Evaluation = { evaluationId: "EVAL-ROADMAP", skillId: rubric.skillId, evaluationType: "TRANSFER", trigger: "PRACTICE_ENGINE", difficulty: 0.7, exerciseIds: ["PE-1"], expectedBehavior: ["Analyze dependencies."], actualBehavior: ["Analyzed dependencies."], context: { contextId: "EC-1", allowedKnowledgeIds: [], hiddenReferenceIds: ["REF-1"], availableTools: [], providedHints: [], exposedExampleIds: [], environmentalConditions: [], frozenAt: stamp }, rubricId: rubric.rubricId, rubricVersion: rubric.version, evaluator: { type: "DETERMINISTIC_EVALUATOR", actor, version: "1", independent: true }, createdAt: stamp };
const measurements = (overrides: Partial<Record<EvaluationDimensionMeasurement["dimension"], number>> = {}): EvaluationDimensionMeasurement[] => Object.entries({ CORRECTNESS: 0.94, APPLICATION: 0.9, GENERALIZATION: 0.84, BOUNDARY_RECOGNITION: 0.91, EXCEPTION_HANDLING: 0.78, CONSISTENCY: 0.88, CALIBRATION: 0.93, ...overrides }).map(([dimension, score]) => ({ dimension: dimension as EvaluationDimensionMeasurement["dimension"], score, scoringMethod: "CONSTRAINT_SATISFACTION", rationale: `${dimension} independently measured.` }));

describe("Phase 21 evaluation rubric scoring", () => {
  it("preserves dimensions and prevents a high average from masking a critical boundary failure", () => {
    const result = new EvaluationRubricEngine().score({ evaluation, rubric, measurements: measurements({ BOUNDARY_RECOGNITION: 0.2 }), scoreId: "ES-1", scoredAt: stamp, scoringReliable: true });
    expect(result).toMatchObject({ score: { outcome: "FAIL", dimensionScores: { CORRECTNESS: 0.94, BOUNDARY_RECOGNITION: 0.2 } }, criticalDimensionsFailed: ["BOUNDARY_RECOGNITION"] });
    expect(result.failures).toEqual([expect.objectContaining({ dimension: "BOUNDARY_RECOGNITION", category: "BOUNDARY_FAILURE" })]);
  });
  it("returns partial for noncritical gaps and needs review for unreliable scoring", () => {
    expect(new EvaluationRubricEngine().score({ evaluation, rubric, measurements: measurements({ EXCEPTION_HANDLING: 0.4 }), scoreId: "ES-2", scoredAt: stamp, scoringReliable: true })).toMatchObject({ score: { outcome: "PARTIAL" }, failures: [expect.objectContaining({ category: "EXCEPTION_FAILURE" })] });
    expect(new EvaluationRubricEngine().score({ evaluation, rubric, measurements: measurements(), scoreId: "ES-3", scoredAt: stamp, scoringReliable: false })).toMatchObject({ score: { outcome: "NEEDS_REVIEW" } });
  });
});

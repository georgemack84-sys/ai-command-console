import { describe, expect, it } from "vitest";
import { EvaluationAnalysisService } from "@/services/learning-constitution";
import type { EvaluationObservation } from "@/types/learning-constitution";

const actor = { actorId: "human:teacher", actorType: "HUMAN" as const };
const observation = (id: string, score: number, confidence: number | null, transferLevel: EvaluationObservation["transferLevel"], status: EvaluationObservation["validity"]["status"] = "VALID", scoredAt = "2026-09-01T00:00:00.000Z"): EvaluationObservation => ({ evaluation: { evaluationId: id, skillId: "SK-ROADMAP", evaluationType: "TRANSFER", trigger: "PRACTICE_ENGINE", difficulty: 0.6, exerciseIds: [`PE:${id}`], expectedBehavior: [], actualBehavior: [], context: { contextId: `EC:${id}`, allowedKnowledgeIds: [], hiddenReferenceIds: [], availableTools: [], providedHints: [], exposedExampleIds: [], environmentalConditions: [], frozenAt: scoredAt }, rubricId: "ER-1", rubricVersion: "1", evaluator: { type: "DETERMINISTIC_EVALUATOR", actor, version: "1", independent: true }, createdAt: scoredAt }, response: { responseId: `RESP:${id}`, evaluationId: id, exerciseId: `PE:${id}`, actualResponse: "answer", selfReportedConfidence: confidence, capturedAt: scoredAt }, score: { scoreId: `SCORE:${id}`, evaluationId: id, dimensionScores: { CORRECTNESS: score, APPLICATION: score, GENERALIZATION: score, BOUNDARY_RECOGNITION: score, EXCEPTION_HANDLING: score, CONSISTENCY: score, CALIBRATION: score }, overallScore: score, outcome: "PASS", scoredAt }, validity: { validityId: `VALID:${id}`, evaluationId: id, status, reasonCodes: [], checkedAt: scoredAt }, contextKey: id === "1" ? "planning" : "logistics", transferLevel });

describe("Phase 21 evaluation analysis", () => {
  it("uses only valid history to expose calibration, consistency, transfer, and recency", () => {
    const analysis = new EvaluationAnalysisService().analyze({ analysisId: "EA-1", skillId: "SK-ROADMAP", observations: [observation("1", 0.9, 0.9, "EXACT"), observation("2", 0.8, 0.8, "NOVEL"), observation("3", 0.85, 0.85, "EDGE"), observation("invalid", 0.1, 1, "ADVERSARIAL", "INVALID")], analyzedAt: "2026-09-02T00:00:00.000Z" });
    expect(analysis).toMatchObject({ calibration: { sampleSize: 3, state: "WELL_CALIBRATED" }, consistency: { sampleSize: 3, state: "CONSISTENT", contextCount: 2 }, transfer: { EXACT: { sampleSize: 1, meanScore: 0.9 }, ADVERSARIAL: { sampleSize: 0, meanScore: null } }, recency: "CURRENT", masteryEffect: "NONE" });
  });
  it("identifies overconfidence and aging evidence without changing competence", () => {
    const analysis = new EvaluationAnalysisService().analyze({ analysisId: "EA-2", skillId: "SK-ROADMAP", observations: [observation("1", 0.2, 0.95, "NOVEL", "VALID", "2026-05-01T00:00:00.000Z"), observation("2", 0.3, 0.9, "EDGE", "VALID", "2026-05-02T00:00:00.000Z"), observation("3", 0.25, 0.95, "ADVERSARIAL", "VALID", "2026-05-03T00:00:00.000Z")], analyzedAt: "2026-09-02T00:00:00.000Z" });
    expect(analysis).toMatchObject({ calibration: { state: "OVERCONFIDENT" }, recency: "STALE", durableKnowledgeEffect: "NONE", executionPermissionGranted: false });
  });
});

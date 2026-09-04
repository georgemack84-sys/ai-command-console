import { describe, expect, it } from "vitest";
import { EvaluationArtifactService, EvaluationLifecycleService, EvaluationValidityService } from "@/services/learning-constitution";
import type { CompetenceEvaluationRubric, Evaluation, EvaluationArtifactRecord, EvaluationArtifactStore, EvaluationEvidence, EvaluationFailure, EvaluationResponse, EvaluationScore } from "@/types/learning-constitution";

const actor = { actorId: "human:teacher", actorType: "HUMAN" as const }; const stamp = "2026-09-02T01:00:00.000Z";
const scores = { CORRECTNESS: 0.94, APPLICATION: 0.89, GENERALIZATION: 0.84, BOUNDARY_RECOGNITION: 0.91, EXCEPTION_HANDLING: 0.78, CONSISTENCY: 0.88, CALIBRATION: 0.93 } as const;
const rubric: CompetenceEvaluationRubric = { rubricId: "ER-1", skillId: "SK-ROADMAP", version: "1", dimensionThresholds: scores, criticalDimensions: ["CORRECTNESS", "BOUNDARY_RECOGNITION"], requiredEvaluationTypes: ["TRANSFER", "BOUNDARY"], createdBy: actor, createdAt: stamp };
const evaluation = (overrides: Partial<Evaluation> = {}): Evaluation => ({ evaluationId: "EVAL-1", skillId: "SK-ROADMAP", evaluationType: "TRANSFER", trigger: "PRACTICE_ENGINE", difficulty: 0.7, exerciseIds: ["PE-1"], expectedBehavior: ["Identify dependencies."], actualBehavior: ["Dependencies identified."], context: { contextId: "EC-1", allowedKnowledgeIds: ["K-1"], hiddenReferenceIds: ["REF-1"], availableTools: [], providedHints: [], exposedExampleIds: [], environmentalConditions: ["isolated"], frozenAt: stamp }, rubricId: rubric.rubricId, rubricVersion: rubric.version, evaluator: { type: "DETERMINISTIC_EVALUATOR", actor, version: "1", independent: true }, createdAt: stamp, ...overrides });
const response: EvaluationResponse = { responseId: "ERESP-1", evaluationId: "EVAL-1", exerciseId: "PE-1", actualResponse: "Dependency first.", selfReportedConfidence: 0.8, capturedAt: stamp };
const score: EvaluationScore = { scoreId: "ESCORE-1", evaluationId: "EVAL-1", dimensionScores: scores, overallScore: 0.88, outcome: "PASS", scoredAt: stamp };
const store = (): EvaluationArtifactStore => { const records: EvaluationArtifactRecord[] = []; return { append: async (record) => { const existing = records.find((item) => item.artifactId === record.artifactId); if (existing) return existing; records.push(record); return record; }, listArtifacts: async (subjectId) => records.filter((record) => record.subjectId === subjectId), listWorkspaceArtifacts: async () => [...records] }; };

describe("Phase 21 evaluation foundation", () => {
  it("enforces the immutable evaluation lifecycle", () => { const lifecycle = new EvaluationLifecycleService(); expect(() => lifecycle.transition(null, "CREATED")).not.toThrow(); expect(() => lifecycle.transition("CREATED", "READY")).not.toThrow(); expect(() => lifecycle.transition("READY", "COMPLETED")).toThrow("invalid evaluation lifecycle transition"); });
  it("keeps all seven scores independent and retains only a valid, frozen, independently evaluated evidence record", async () => {
    expect(Object.keys(score.dimensionScores)).toHaveLength(7); expect(score.dimensionScores.EXCEPTION_HANDLING).not.toBe(score.dimensionScores.CORRECTNESS);
    const validity = new EvaluationValidityService().validate({ evaluation: evaluation(), score, responses: [response], rubric, failures: [] }); expect(validity).toMatchObject({ status: "VALID" });
    const evidence: EvaluationEvidence = { evidenceId: "EE-1", evaluationId: "EVAL-1", skillId: "SK-ROADMAP", exerciseIds: ["PE-1"], responseIds: [response.responseId], scoreId: score.scoreId, validityId: validity.validityId, evaluator: evaluation().evaluator, createdAt: stamp, skillRegistryEffect: "EVIDENCE_ONLY", durableKnowledgeEffect: "NONE", executionPermissionGranted: false };
    const artifacts = store(); await new EvaluationArtifactService(artifacts).record({ evaluation: evaluation(), rubric, responses: [response], score, failures: [], validity, evidence }, "workspace:1", "eval:1");
    expect((await artifacts.listWorkspaceArtifacts()).map((record) => record.artifactType)).toEqual(["RUBRIC", "EVALUATION", "RESPONSE", "SCORE", "VALIDITY", "EVIDENCE"]);
    expect(evidence).toMatchObject({ skillRegistryEffect: "EVIDENCE_ONLY", durableKnowledgeEffect: "NONE", executionPermissionGranted: false });
  });
  it("invalidates leaked or self-evaluated tests and refuses their evidence", async () => {
    const leaked = evaluation({ context: { ...evaluation().context, allowedKnowledgeIds: ["K-1", "REF-1"] }, evaluator: { ...evaluation().evaluator, actor: { actorId: "agent:noesis", actorType: "AGENT" }, independent: false } });
    const validity = new EvaluationValidityService().validate({ evaluation: leaked, score, responses: [response], rubric, failures: [] }); expect(validity).toMatchObject({ status: "INVALID", reasonCodes: expect.arrayContaining(["EVALUATION_INFORMATION_LEAK", "EVALUATOR_NOT_INDEPENDENT"]) });
    const evidence: EvaluationEvidence = { evidenceId: "EE-INVALID", evaluationId: leaked.evaluationId, skillId: leaked.skillId, exerciseIds: leaked.exerciseIds, responseIds: [response.responseId], scoreId: score.scoreId, validityId: validity.validityId, evaluator: leaked.evaluator, createdAt: stamp, skillRegistryEffect: "EVIDENCE_ONLY", durableKnowledgeEffect: "NONE", executionPermissionGranted: false };
    await expect(new EvaluationArtifactService(store()).record({ evaluation: leaked, rubric, responses: [response], score, failures: [] as readonly EvaluationFailure[], validity, evidence }, "workspace:1", "eval:invalid")).rejects.toThrow("requires a valid");
  });
});

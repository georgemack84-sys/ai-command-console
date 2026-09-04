import { describe, expect, it } from "vitest";
import { EvaluationReflectionEvidenceCollector, ReflectionFailureLocalizationService } from "@/services/learning-constitution";
import type { EvaluationArtifactRecord, EvaluationArtifactStore, EvaluationFailure, EvaluationScore, EvaluationValidity } from "@/types/learning-constitution";

const failure = (failureId: string, category: EvaluationFailure["category"], rationale: string): EvaluationFailure => ({ failureId, evaluationId: "EVAL-1", dimension: "APPLICATION", category, rationale, createdAt: "2026-09-02T07:00:00.000Z" });
const store = (): EvaluationArtifactStore => { const records: EvaluationArtifactRecord[] = [{ artifactId: "SCORE:1", artifactType: "SCORE", subjectId: "EVAL-1", payload: { scoreId: "ES-1", evaluationId: "EVAL-1", dimensionScores: { CORRECTNESS: 0.9, APPLICATION: 0.2, GENERALIZATION: 0.5, BOUNDARY_RECOGNITION: 0.3, EXCEPTION_HANDLING: 0.9, CONSISTENCY: 0.8, CALIBRATION: 0.8 }, overallScore: 0.5, outcome: "FAIL", scoredAt: "2026-09-02T07:00:00.000Z" } satisfies EvaluationScore, createdAt: "2026-09-02T07:00:00.000Z" }, { artifactId: "VALIDITY:1", artifactType: "VALIDITY", subjectId: "EVAL-1", payload: { validityId: "EV-1", evaluationId: "EVAL-1", status: "VALID", reasonCodes: [], checkedAt: "2026-09-02T07:00:00.000Z" } satisfies EvaluationValidity, createdAt: "2026-09-02T07:00:00.000Z" }, { artifactId: "FAILURE:1", artifactType: "FAILURE", subjectId: "EVAL-1", payload: failure("EF-BOUNDARY", "BOUNDARY_FAILURE", "Applicability was not checked."), createdAt: "2026-09-02T07:00:00.000Z" }, { artifactId: "FAILURE:2", artifactType: "FAILURE", subjectId: "EVAL-1", payload: failure("EF-DEPENDENCY", "DEPENDENCY_FAILURE", "Prerequisite dependency analysis was weak."), createdAt: "2026-09-02T07:00:00.000Z" }]; return { append: async (record) => record, listArtifacts: async (subjectId) => records.filter((record) => record.subjectId === subjectId), listWorkspaceArtifacts: async () => records }; };

describe("Phase 22 failure localization and evidence collection", () => {
  it("collects retained evaluation facts and prefers the earliest prerequisite divergence", async () => {
    const collected = await new EvaluationReflectionEvidenceCollector(store()).collect("EVAL-1");
    expect(collected).toMatchObject({ score: { outcome: "FAIL" }, validity: { status: "VALID" }, evidence: expect.arrayContaining([expect.objectContaining({ sourceId: "EF-DEPENDENCY", supports: true })]) });
    expect(new ReflectionFailureLocalizationService().localize(collected.failures)).toEqual({ failureType: "PREREQUISITE_GAP", location: "RETRIEVE_KNOWLEDGE", sourceFailureIds: ["EF-DEPENDENCY"] });
  });
  it("returns explicit uncertainty if the evaluation supplies no classified failure", () => { expect(new ReflectionFailureLocalizationService().localize([])).toEqual({ failureType: "UNKNOWN", location: "UNKNOWN", sourceFailureIds: [] }); });
});

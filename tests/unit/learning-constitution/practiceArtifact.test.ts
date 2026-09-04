import { describe, expect, it } from "vitest";
import { InMemoryLearningAuditLedger, PracticeArtifactService, PracticeEvidenceService } from "@/services/learning-constitution";
import type { PracticeArtifactRecord, PracticeArtifactStore, PracticeEvaluation, PracticeEvaluationSpec, PracticeExercise } from "@/types/learning-constitution";

const actor = { actorId: "human:teacher", actorType: "HUMAN" as const };
const exercise: PracticeExercise = { exerciseId: "PE-1", state: "GENERATED", source: "HUMAN_GENERATED", targetSkillIds: ["SK-ROADMAP"], prerequisiteSkillIds: ["SK-DEPENDENCY"], difficulty: 0.5, transferLevel: "MODIFIED", transferDistance: 1, scenario: "Plan a changed dependency scenario.", instructions: "Explain the sequence.", constraints: [], expectedCompetencies: ["dependency analysis"], visibleEvaluationCriteria: ["rationale"], hiddenCriteriaCount: 1, hiddenChallengeCount: 1, scenarioFeatures: { domain: "planning", ambiguityPresent: false, edgeConditionPresent: false, adversarialPressurePresent: false }, similarity: { structuralFingerprint: "dependency", solutionFingerprint: "sequence", languageFingerprint: "planning-v1" }, lineage: { targetSkillIds: ["SK-ROADMAP"], knowledgeIds: ["K-1"], procedureIds: [], principleIds: [], exampleIds: ["EX-1"], sourceSnapshotId: "snapshot:1" }, generation: { generatorVersion: "20", configVersion: "20", generatedAt: "2026-09-01T00:00:00.000Z", generatedBy: actor } };
const spec: PracticeEvaluationSpec = { exerciseId: "PE-1", rubricVersion: "1", hiddenCriteria: ["missing dependency"], hiddenChallenges: ["misleading order"] };
const evaluation: PracticeEvaluation = { evaluationId: "PVE-1", attemptId: "PA-1", exerciseId: "PE-1", outcome: "PASS", score: 0.8, failureTypes: [], matchedCriteria: ["rationale"], missedCriteria: [], evaluator: actor, evaluatedAt: "2026-09-01T00:01:00.000Z", rubricVersion: "1" };
const store = (): PracticeArtifactStore & { records: PracticeArtifactRecord[] } => { const records: PracticeArtifactRecord[] = []; return { records, append: async (artifact) => { const replay = records.find((item) => item.artifactId === artifact.artifactId); if (replay) return replay; records.push(artifact); return artifact; }, listArtifacts: async (subjectId) => records.filter((artifact) => artifact.subjectId === subjectId), listWorkspaceArtifacts: async () => [...records] }; };

describe("Phase 20 practice persistence", () => {
  it("records replay-safe practice facts and audit events without a durable knowledge path", async () => {
    const artifacts = store(); const audit = new InMemoryLearningAuditLedger(); const service = new PracticeArtifactService(artifacts, audit);
    const validated = await service.transition(await service.createExercise(exercise, spec, "workspace:1", "practice:1"), "VALIDATED", "workspace:1", "practice:1");
    const assigned = await service.transition(validated, "ASSIGNED", "workspace:1", "practice:1");
    await service.recordAttempt({ attemptId: "PA-1", exerciseId: assigned.exerciseId, learnerId: "agent:noesis", response: "Dependency first.", submittedAt: "2026-09-01T00:00:30.000Z", responseConfidence: 0.7 }, actor, "workspace:1", "practice:1");
    await service.recordEvaluation(evaluation, "workspace:1", "practice:1");
    const evidence = new PracticeEvidenceService().create(exercise, evaluation, "PEV-1");
    await service.recordEvidence(evidence, actor, "workspace:1", "practice:1");
    await service.recordEvidence(evidence, actor, "workspace:1", "practice:1");
    expect(artifacts.records.map((artifact) => artifact.artifactType)).toEqual(["EXERCISE", "EVALUATION_SPEC", "LIFECYCLE", "LIFECYCLE", "ATTEMPT", "EVALUATION", "EVIDENCE"]);
    expect((await audit.list("workspace:1")).map((entry) => entry.event.eventType)).toEqual(["PRACTICE_EXERCISE_GENERATED", "PRACTICE_EXERCISE_VALIDATED", "PRACTICE_EXERCISE_ASSIGNED", "PRACTICE_ATTEMPT_RECORDED", "PRACTICE_EXERCISE_EVALUATED", "PRACTICE_EVIDENCE_CREATED"]);
    expect(evidence).toMatchObject({ skillRegistryEffect: "EVIDENCE_ONLY", durableKnowledgeEffect: "NONE", executionPermissionGranted: false });
  });
});

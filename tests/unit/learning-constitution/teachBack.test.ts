import { describe, expect, it } from "vitest";
import { DeterministicTeachBackEvaluator, DeterministicTeachBackPolicy, InMemoryTeachBackHumanDecisionRepository, InMemoryTeachBackRepository, TeachBackEvidenceResolver, TeachBackHumanReviewService, TeachBackLifecycleService, TeachBackStructuralValidator } from "@/services/learning-constitution";
import type { TeachBack } from "@/types/learning-constitution";

const teachBack: TeachBack = { teachBackId: "tb:1", lessonId: "lesson:1", teachingEventId: "teaching:1", candidateKnowledgeId: "candidate:1", generatedAt: "2026-09-01T00:00:00.000Z", generatedBy: { actorId: "agent:noesis", actorType: "AGENT" }, lesson: "Preserve explicit human knowledge during conflicts.", rationale: "It prevents agent inference from silently replacing a human lesson.", scope: "Durable learning conflict resolution.", example: "A project database decision remains PostgreSQL despite an agent preference for SQLite.", counterexample: "A brainstorming proposal does not change durable knowledge.", uncertainties: [], status: "AWAITING_EVALUATION", immutable: true };

describe("Phase 11 teach-back foundation", () => {
  it("requires teach-back for significant and broad-scope lessons", () => {
    const policy = new DeterministicTeachBackPolicy();
    expect(policy.evaluate({ classification: "PRINCIPLE" })).toBe("REQUIRED");
    expect(policy.evaluate({ classification: "FACT" })).toBe("NOT_REQUIRED");
    expect(policy.evaluate({ classification: "FACT", scope: { type: "GLOBAL" } })).toBe("REQUIRED");
  });
  it("enforces all six teach-back sections as immutable evidence", () => {
    const validator = new TeachBackStructuralValidator();
    expect(validator.validate(teachBack)).toMatchObject({ valid: true, authorityEffect: "UNCHANGED" });
    expect(validator.validate({ ...teachBack, example: "", immutable: false })).toMatchObject({ valid: false, violations: expect.arrayContaining(["EXAMPLE_MISSING", "TEACH_BACK_MUST_BE_IMMUTABLE"]) });
  });
  it("produces structured evidence and rejects parroting or scope loss", () => {
    const evaluator = new DeterministicTeachBackEvaluator();
    expect(evaluator.evaluate({ teachBack, taughtLesson: teachBack.lesson, expectedScope: teachBack.scope, sourceExamples: ["Human supplied example."], evaluator: { actorId: "agent:evaluator", actorType: "AGENT" }, now: teachBack.generatedAt })).toMatchObject({ outcome: "PASS", dimensions: { fidelity: "PASS", generalization: "PASS" } });
    expect(evaluator.evaluate({ teachBack: { ...teachBack, lesson: "Unrelated statement.", scope: "Global policy", example: "Human supplied example." }, taughtLesson: teachBack.lesson, expectedScope: teachBack.scope, sourceExamples: ["Human supplied example."], evaluator: { actorId: "agent:evaluator", actorType: "AGENT" }, now: teachBack.generatedAt })).toMatchObject({ outcome: "FAIL", findings: expect.arrayContaining(["FAILED_FIDELITY", "FAILED_SCOPE", "FAILED_GENERALIZATION"]) });
  });
  it("keeps every teach-back attempt and evaluation immutable evidence", async () => {
    const repository = new InMemoryTeachBackRepository(); const service = new TeachBackLifecycleService(repository, new DeterministicTeachBackEvaluator());
    await service.evaluate({ teachBack, taughtLesson: teachBack.lesson, expectedScope: teachBack.scope, sourceExamples: [], evaluator: { actorId: "agent:evaluator", actorType: "AGENT" }, now: teachBack.generatedAt });
    await service.evaluate({ teachBack: { ...teachBack, teachBackId: "tb:2", example: "A new valid situation applies the same boundary." }, taughtLesson: teachBack.lesson, expectedScope: teachBack.scope, sourceExamples: [], evaluator: { actorId: "agent:evaluator", actorType: "AGENT" }, now: teachBack.generatedAt });
    await expect(repository.listByCandidateId("candidate:1")).resolves.toHaveLength(2);
    await expect(repository.listEvaluations("tb:1")).resolves.toHaveLength(1);
  });
  it("records human review immutably and rejects non-human reviewers", async () => {
    const reviews = new InMemoryTeachBackHumanDecisionRepository(); const service = new TeachBackHumanReviewService(reviews);
    await service.record({ decisionId: "review:1", teachBackId: "tb:1", action: "REQUEST_RETRY", actor: { actorId: "user:teacher", actorType: "HUMAN" }, note: "Clarify the policy boundary.", createdAt: teachBack.generatedAt, immutable: true });
    await expect(reviews.list("tb:1")).resolves.toHaveLength(1);
    await expect(service.record({ decisionId: "review:2", teachBackId: "tb:1", action: "APPROVE", actor: teachBack.generatedBy, note: "No.", createdAt: teachBack.generatedAt, immutable: true })).rejects.toThrow("human actor");
  });
  it("exposes only the latest evaluation outcome to the learning gate", async () => {
    const repository = new InMemoryTeachBackRepository(); const service = new TeachBackLifecycleService(repository, new DeterministicTeachBackEvaluator());
    await service.evaluate({ teachBack, taughtLesson: teachBack.lesson, expectedScope: teachBack.scope, sourceExamples: [], evaluator: { actorId: "agent:evaluator", actorType: "AGENT" }, now: teachBack.generatedAt });
    await expect(new TeachBackEvidenceResolver(repository).latestOutcome("candidate:1")).resolves.toBe("PASS");
  });
  it("fails adversarial parroting, scope inflation, and false counterexamples", () => {
    const evaluator = new DeterministicTeachBackEvaluator(); const input = { taughtLesson: teachBack.lesson, expectedScope: teachBack.scope, sourceExamples: ["A project database decision remains PostgreSQL despite an agent preference for SQLite."], evaluator: { actorId: "agent:evaluator", actorType: "AGENT" as const }, now: teachBack.generatedAt };
    expect(evaluator.evaluate({ teachBack: { ...teachBack, example: input.sourceExamples[0]!, scope: "Global policy", counterexample: "A project database decision remains PostgreSQL despite an agent preference for SQLite." }, ...input })).toMatchObject({ outcome: "FAIL", findings: expect.arrayContaining(["FAILED_SCOPE", "FAILED_GENERALIZATION", "FAILED_EXCLUSION"]) });
  });
  it("does not expose teach-back reasoning as durable knowledge or authority", async () => {
    const repository = new InMemoryTeachBackRepository(); await repository.append(teachBack);
    const stored = (await repository.listByCandidateId("candidate:1"))[0]!;
    expect(stored).not.toHaveProperty("authority");
    expect(stored).not.toHaveProperty("classification");
    expect(stored.rationale).toContain("prevents agent inference");
  });
});

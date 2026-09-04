import { describe, expect, it } from "vitest";
import { ConservativeExampleValidator, ExampleCandidateService, ExampleCoverageService, ExampleHumanReviewService, ExampleLifecycleService, ExampleSelectionService, InMemoryLearningAuditLedger } from "@/services/learning-constitution";
import type { LearningExample } from "@/types/learning-constitution";

const now = "2026-09-01T00:00:00.000Z";
const human = { actorId: "human:manager", actorType: "HUMAN" as const };
const candidate: LearningExample = { exampleId: "example:acceptance", exampleType: "COUNTEREXAMPLE", parent: { parentType: "PRINCIPLE", parentId: "principle:acceptance", scope: { type: "PROJECT", id: "noesis" }, authority: "HUMAN_DECISION", version: "1", exists: true }, scenario: "A request suggests expanding a project correction globally.", inputs: {}, context: "Project-scoped correction.", expectedReasoning: "Keep the correction inside its parent scope.", expectedBehavior: "Reject the scope expansion.", expectedOutput: "A scoped response.", explanation: "Illustrates the boundary of the parent principle.", contentRole: "ILLUSTRATIVE", source: "HUMAN_TEACHING", authority: "HUMAN_CREATED", scope: { type: "PROJECT", id: "noesis" }, provenanceIds: ["teaching:acceptance"], diversityKey: "scope-expansion", introducesNewRule: false, introducesException: false, status: "CANDIDATE", createdBy: human, createdAt: now, immutable: true, executionPermissionGranted: false };

describe("Phase 15 acceptance", () => {
  it("keeps examples evidence-only across the complete lifecycle", async () => {
    const artifacts: any[] = []; const store = { append: async (artifact: any) => { artifacts.push(artifact); return artifact; }, listArtifacts: async (subjectId: string) => artifacts.filter((artifact) => artifact.subjectId === subjectId) };
    const audit = new InMemoryLearningAuditLedger(); const validator = new ConservativeExampleValidator();
    const submitted = await new ExampleCandidateService(validator, store, audit).submit(candidate, "workspace:1", "submit:1");
    expect(submitted.validation.status).toBe("VALID");
    const approved = await new ExampleHumanReviewService(validator, store, audit).record({ review: { reviewId: "review:acceptance", exampleId: candidate.exampleId, action: "APPROVE", actor: human, note: "Bounded and accurate.", reviewedAt: now, immutable: true }, candidate }, "workspace:1", "review:acceptance");
    expect(approved.approved).toMatchObject({ parentMutationAuthorized: false, executionPermissionGranted: false });
    const selection = await new ExampleSelectionService(audit).select({ parentId: candidate.parent.parentId, scope: candidate.scope, purpose: "TEACHING", candidates: [approved.approved!], maxExamples: 1, actor: human, occurredAt: now }, "workspace:1", "selection:acceptance");
    expect(selection).toMatchObject({ diversityCount: 1, authorityEffect: "UNCHANGED", executionPermissionGranted: false });
    expect(new ExampleCoverageService().summarize(candidate.parent.parentId, artifacts).coverage).toMatchObject({ coverage: "MINIMAL", counts: { COUNTEREXAMPLE: 1 } });
    const lifecycle = await new ExampleLifecycleService(store, audit).record({ decisionId: "lifecycle:acceptance", action: "SUPERSEDE", exampleId: candidate.exampleId, replacementExampleId: "example:replacement", actor: human, reason: "A clearer counterexample replaces it.", decidedAt: now, immutable: true, parentMutationAuthorized: false, executionPermissionGranted: false }, "workspace:1", "lifecycle:acceptance");
    expect(lifecycle.decision).toMatchObject({ parentMutationAuthorized: false, executionPermissionGranted: false });
    expect(artifacts.map((artifact) => artifact.artifactType)).toEqual(["CANDIDATE", "VALIDATION", "REVIEW", "APPROVAL", "SUPERSESSION"]);
    expect((await audit.list("workspace:1")).map((entry) => entry.event.eventType)).toEqual(["EXAMPLE_PROPOSED", "EXAMPLE_APPROVED", "EXAMPLE_USED_FOR_TEACHING", "EXAMPLE_SUPERSEDED"]);
  });
});

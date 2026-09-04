import { describe, expect, it } from "vitest";
import { ConservativeExampleValidator, ExampleCandidateService, ExampleCoverageService, ExampleHumanReviewService, ExampleLibraryService, ExampleLifecycleService, ExampleSelectionService, InMemoryLearningAuditLedger, PrismaExampleArtifactRepository } from "@/services/learning-constitution";
import type { LearningExample } from "@/types/learning-constitution";

const now = "2026-09-01T00:00:00.000Z"; const actor = { actorId: "agent:noesis", actorType: "AGENT" as const };
const example = (id: string, type: LearningExample["exampleType"], diversityKey = id): LearningExample => ({ exampleId: id, exampleType: type, parent: { parentType: "PRINCIPLE", parentId: "principle:1", scope: { type: "PROJECT", id: "noesis" }, authority: "HUMAN_DECISION", version: "1", exists: true }, scenario: "A human says a correction applies to this project.", inputs: {}, context: "Illustrative scenario.", expectedReasoning: "Identify the correction and retain project scope.", expectedBehavior: "Defer scope expansion.", expectedOutput: "Correction case.", explanation: "Illustrates scoped correction handling.", contentRole: "ILLUSTRATIVE", source: "AGENT_GENERATED", authority: "AGENT_DERIVED", scope: { type: "PROJECT", id: "noesis" }, provenanceIds: ["teaching:1"], diversityKey, introducesNewRule: false, introducesException: false, status: "CANDIDATE", createdBy: actor, createdAt: now, immutable: true, executionPermissionGranted: false });

describe("Phase 15 Example Library security boundary", () => {
  it("keeps examples evidence-only and measures four-type coverage independently", async () => {
    const audit = new InMemoryLearningAuditLedger(); const service = new ExampleLibraryService(new ConservativeExampleValidator(), audit); const positive = example("example:1", "POSITIVE");
    await expect(service.assess(positive, "workspace:1", "example:1")).resolves.toMatchObject({ status: "VALID", authorityEffect: "UNCHANGED", executionPermissionGranted: false });
    expect(service.coverage("principle:1", [positive, example("example:2", "NEGATIVE"), example("example:3", "EDGE_CASE"), example("example:4", "COUNTEREXAMPLE", "example:1")])).toMatchObject({ coverage: "COMPLETE", independenceCount: 3 });
    expect(positive).toMatchObject({ authority: "AGENT_DERIVED", status: "CANDIDATE" });
  });
  it("defers scope expansion and hidden rules or exceptions rather than accepting example injection", () => {
    const validator = new ConservativeExampleValidator();
    expect(validator.validate({ ...example("example:5", "COUNTEREXAMPLE"), scope: { type: "GLOBAL" }, introducesNewRule: true, introducesException: true })).toMatchObject({ status: "DEFER", reasonCodes: expect.arrayContaining(["PARENT_SCOPE_EXPANSION", "EXAMPLE_INTRODUCES_NEW_RULE", "EXAMPLE_INTRODUCES_EXCEPTION"]) });
  });
  it("persists immutable workspace-scoped evidence without exposing mutation", async () => {
    const rows: any[] = [];
    const repo = new PrismaExampleArtifactRepository("workspace:1", { noesisExampleArtifact: {
      findUnique: async ({ where }: any) => rows.find((row) => row.artifactId === where.artifactId) ?? null,
      create: async ({ data }: any) => { const row = { ...data, createdAt: data.createdAt }; rows.push(row); return row; },
      findMany: async ({ where }: any) => rows.filter((row) => row.workspaceId === where.workspaceId && row.subjectId === where.subjectId),
    } } as any);
    const artifact = { artifactId: "artifact:example:1", artifactType: "CANDIDATE" as const, subjectId: "example:1", payload: example("example:1", "POSITIVE"), createdAt: now };
    await expect(repo.append(artifact)).resolves.toEqual(artifact);
    await expect(repo.append(artifact)).resolves.toEqual(artifact);
    await expect(repo.listArtifacts("example:1")).resolves.toEqual([artifact]);
    await expect(repo.append({ ...artifact, payload: { changed: true } })).rejects.toThrow("example artifact id collision");
  });
  it("requires a human, valid candidate, and immutable approval evidence before pedagogical use", async () => {
    const stored: any[] = []; const artifacts = { append: async (item: any) => { stored.push(item); return item; }, listArtifacts: async () => [] };
    const review = new ExampleHumanReviewService(new ConservativeExampleValidator(), artifacts);
    const decision = await review.record({ review: { reviewId: "review:1", exampleId: "example:1", action: "APPROVE", actor: { actorId: "human:1", actorType: "HUMAN" }, note: "Accurate and bounded.", reviewedAt: now, immutable: true }, candidate: example("example:1", "POSITIVE") }, "workspace:1", "review:1");
    expect(decision.approved).toMatchObject({ authority: "APPROVED_EXAMPLE", parentMutationAuthorized: false, executionPermissionGranted: false });
    expect(stored.map((item) => item.artifactType)).toEqual(["REVIEW", "APPROVAL"]);
    await expect(review.record({ review: { reviewId: "review:2", exampleId: "example:1", action: "APPROVE", actor: actor, note: "no", reviewedAt: now, immutable: true }, candidate: example("example:1", "POSITIVE") }, "workspace:1", "review:2")).rejects.toThrow("human actor");
  });
  it("selects only approved, parent-matched, diverse evidence for teaching", async () => {
    const approved = (id: string, diversityKey = id) => ({ approvedExampleId: `approved:${id}`, reviewId: `review:${id}`, example: example(id, "POSITIVE", diversityKey), authority: "APPROVED_EXAMPLE" as const, status: "APPROVED" as const, approvedBy: { actorId: "human:1", actorType: "HUMAN" as const }, approvedAt: now, immutable: true as const, parentMutationAuthorized: false as const, executionPermissionGranted: false as const });
    const selection = await new ExampleSelectionService().select({ parentId: "principle:1", scope: { type: "PROJECT", id: "noesis" }, purpose: "TEACHING", candidates: [approved("1", "shared"), approved("2", "shared"), { ...approved("3"), example: { ...example("3", "POSITIVE"), parent: { ...example("3", "POSITIVE").parent, parentId: "principle:other" } } }], maxExamples: 3, actor, occurredAt: now }, "workspace:1", "selection:1");
    expect(selection).toMatchObject({ excludedCount: 2, diversityCount: 1, persistenceEffect: "NONE", executionPermissionGranted: false });
    expect(selection.examples.map((item) => item.approvedExampleId)).toEqual(["approved:1"]);
  });
  it("counts only immutable approval artifacts in parent coverage", () => {
    const approved = { approvedExampleId: "approved:1", reviewId: "review:1", example: example("example:1", "NEGATIVE"), authority: "APPROVED_EXAMPLE" as const, status: "APPROVED" as const, approvedBy: { actorId: "human:1", actorType: "HUMAN" as const }, approvedAt: now, immutable: true as const, parentMutationAuthorized: false as const, executionPermissionGranted: false as const };
    const summary = new ExampleCoverageService().summarize("principle:1", [{ artifactId: "candidate:1", artifactType: "CANDIDATE", subjectId: "example:unapproved", payload: example("example:unapproved", "POSITIVE"), createdAt: now }, { artifactId: "review:1", artifactType: "REVIEW", subjectId: "example:1", payload: { exampleId: "example:1", action: "APPROVE" }, createdAt: now }, { artifactId: "approval:1", artifactType: "APPROVAL", subjectId: "example:1", payload: approved, createdAt: now }]);
    expect(summary.coverage).toMatchObject({ coverage: "MINIMAL", counts: { POSITIVE: 0, NEGATIVE: 1, EDGE_CASE: 0, COUNTEREXAMPLE: 0 } });
    expect(summary.reviewStatusByExampleId).toEqual({ "example:1": "APPROVED", "example:unapproved": "PENDING" });
  });
  it("records candidate and validation separately before review", async () => {
    const stored: any[] = []; const artifacts = { append: async (item: any) => { stored.push(item); return item; }, listArtifacts: async () => [] };
    const result = await new ExampleCandidateService(new ConservativeExampleValidator(), artifacts).submit(example("example:submit", "EDGE_CASE"), "workspace:1", "submit:1");
    expect(result.validation.status).toBe("VALID");
    expect(stored.map((item) => item.artifactType)).toEqual(["CANDIDATE", "VALIDATION"]);
  });
  it("invalidates or supersedes with new evidence while leaving the original example intact", async () => {
    const stored: any[] = []; const artifacts = { append: async (item: any) => { stored.push(item); return item; }, listArtifacts: async () => [] };
    const result = await new ExampleLifecycleService(artifacts).record({ decisionId: "lifecycle:1", action: "SUPERSEDE", exampleId: "example:1", replacementExampleId: "example:2", actor: { actorId: "human:1", actorType: "HUMAN" }, reason: "The old scenario is ambiguous.", decidedAt: now, immutable: true, parentMutationAuthorized: false, executionPermissionGranted: false }, "workspace:1", "lifecycle:1");
    expect(result).toMatchObject({ persistenceEffect: "CREATED", authorityEffect: "UNCHANGED", executionPermissionGranted: false });
    expect(stored[0]).toMatchObject({ artifactType: "SUPERSESSION", subjectId: "example:1" });
    await expect(new ExampleLifecycleService(artifacts).record({ decisionId: "lifecycle:2", action: "SUPERSEDE", exampleId: "example:1", actor: { actorId: "human:1", actorType: "HUMAN" }, reason: "Missing replacement.", decidedAt: now, immutable: true, parentMutationAuthorized: false, executionPermissionGranted: false }, "workspace:1", "lifecycle:2")).rejects.toThrow("replacement");
  });
});

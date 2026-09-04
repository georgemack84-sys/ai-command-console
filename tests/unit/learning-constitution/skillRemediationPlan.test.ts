import { describe, expect, it } from "vitest";
import { InMemoryLearningAuditLedger, SkillRemediationPlanBuilder, SkillRemediationPlanService } from "@/services/learning-constitution";
import type { SkillGraphArtifactRecord, SkillGraphArtifactStore } from "@/types/learning-constitution";

const diagnosis = {
  status: "RECOMMENDATION" as const,
  targetSkillId: "SK-ARCHITECTURE-ROADMAP",
  hypotheses: [{ targetSkillId: "SK-ARCHITECTURE-ROADMAP", prerequisiteSkillId: "SK-DEPENDENCY", dependencyId: "SD-1", deficit: 12, score: 0.14, graphPath: ["SK-ARCHITECTURE-ROADMAP", "SK-ROADMAP", "SK-DEPENDENCY"], evidenceIds: ["EV-FAILURE", "EV-SD-1"], attribution: "PREREQUISITE_DEFICIENCY" as const, confidence: "MEDIUM" as const, reason: "Below threshold." }],
  attributionAssessments: [], reason: "Supported hypothesis.",
};
const store = (): SkillGraphArtifactStore & { records: SkillGraphArtifactRecord[] } => { const records: SkillGraphArtifactRecord[] = []; return { records, append: async (artifact) => { const replay = records.find((item) => item.artifactId === artifact.artifactId); if (replay) return replay; records.push(artifact); return artifact; }, listWorkspaceArtifacts: async () => [...records] }; };

describe("Phase 19G remediation plans", () => {
  it("builds a narrow, inspectable practice-evaluate-retest sequence from the top hypothesis", () => {
    const plan = new SkillRemediationPlanBuilder().build({ planId: "RP-1", diagnosis, graphVersionId: "SG-V1", procedureIds: ["PX-1"], exampleIds: ["EX-1"], createdBy: { actorId: "human:teacher", actorType: "HUMAN" }, createdAt: "2026-09-01T00:00:00.000Z" });
    expect(plan).toMatchObject({ status: "PROPOSED", bottleneckSkillId: "SK-DEPENDENCY", executionPermissionGranted: false, steps: [expect.objectContaining({ action: "PRACTICE", procedureIds: ["PX-1"], exampleIds: ["EX-1"] }), expect.objectContaining({ action: "PREREQUISITE_EVALUATION" }), expect.objectContaining({ action: "RETEST_TARGET", skillId: "SK-ARCHITECTURE-ROADMAP" })] });
  });
  it("records plan creation and activation as immutable, audited lifecycle facts", async () => {
    const artifacts = store(); const audit = new InMemoryLearningAuditLedger();
    const plan = new SkillRemediationPlanBuilder().build({ planId: "RP-1", diagnosis, graphVersionId: "SG-V1", createdBy: { actorId: "human:teacher", actorType: "HUMAN" }, createdAt: "2026-09-01T00:00:00.000Z" });
    const service = new SkillRemediationPlanService(artifacts, audit);
    await service.create(plan, "workspace:1", "remediation:1");
    await service.activate({ planId: plan.planId, actor: plan.createdBy, activatedAt: "2026-09-01T00:01:00.000Z" }, "workspace:1", "remediation:1");
    expect(artifacts.records.map((artifact) => artifact.artifactType)).toEqual(["REMEDIATION_PLAN_CREATED", "REMEDIATION_PLAN_ACTIVATED"]);
    expect((await audit.list("workspace:1")).map((entry) => entry.event.eventType)).toEqual(["SKILL_REMEDIATION_PLAN_CREATED", "SKILL_REMEDIATION_ACTIVATED"]);
  });
  it("refuses to build a remediation plan from an unlocalized failure", () => {
    expect(() => new SkillRemediationPlanBuilder().build({ planId: "RP-1", diagnosis: { ...diagnosis, status: "NOT_LOCALIZED", hypotheses: [] }, graphVersionId: "SG-V1", createdBy: { actorId: "human:teacher", actorType: "HUMAN" }, createdAt: "2026-09-01T00:00:00.000Z" })).toThrow("supported bottleneck hypothesis");
  });
});

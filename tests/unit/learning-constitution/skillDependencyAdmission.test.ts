import { describe, expect, it } from "vitest";
import { InMemoryLearningAuditLedger, SkillDependencyAdmissionService, SkillGraphProjectionService } from "@/services/learning-constitution";
import type { GateDecision, SkillDependency, SkillGraphArtifactRecord, SkillGraphArtifactStore } from "@/types/learning-constitution";

const dependency = (overrides: Partial<SkillDependency> = {}): SkillDependency => ({
  dependencyId: "SD-044",
  prerequisite: { skillId: "SK-DEPENDENCY-ANALYSIS" },
  dependent: { skillId: "SK-ROADMAP-PLANNING" },
  relationshipType: "PREREQUISITE",
  strength: 0.86,
  requiredMasteryThreshold: 70,
  evidenceIds: ["EV-044"],
  provenance: { provenanceIds: ["PR-044"], assertedBy: { actorId: "human:teacher", actorType: "HUMAN" }, assertedAt: "2026-09-01T00:00:00.000Z" },
  lifecycle: "CANDIDATE",
  graphVersionId: "SG-V1",
  rationale: "Dependency analysis establishes the sequencing constraints used by roadmap planning.",
  ...overrides,
});

const gate = (outcome: GateDecision["outcome"], candidateId = "SD-044"): GateDecision => ({
  evaluationId: "gate-evaluation:44", candidateId, outcome, reasonCodes: [], checks: [], inputFingerprint: "gate-fingerprint", context: { gateVersion: "9", constitutionVersion: "1", taxonomyVersion: "1", authorityPolicyVersion: "1", validationPolicyVersion: "1", conflictEngineVersion: "1", registryVersion: "18", learningIntent: "APPROVED", decisionActorId: "human:teacher" }, authorityEffect: "UNCHANGED", executionPermissionGranted: false,
});

const store = (): SkillGraphArtifactStore & { readonly records: SkillGraphArtifactRecord[] } => {
  const records: SkillGraphArtifactRecord[] = [];
  return {
    records,
    append: async (record) => {
      const replay = records.find((item) => item.artifactId === record.artifactId);
      if (replay) return replay;
      records.push(record);
      return record;
    },
    listWorkspaceArtifacts: async () => [...records],
  };
};

describe("Phase 19B skill dependency admission", () => {
  it("creates an immutable admitted edge and graph version only after gate acceptance", async () => {
    const artifacts = store();
    const audit = new InMemoryLearningAuditLedger();
    const result = await new SkillDependencyAdmissionService(artifacts, undefined, audit).admit({ dependency: dependency(), gateDecision: gate("ACCEPT"), workspaceId: "workspace:1", correlationId: "dependency:44", changeReason: "Human review HR-144." });
    expect(result).toMatchObject({ outcome: "ACCEPT", persistenceEffect: "CREATED", graphVersion: { graphVersionId: "SG-V1", previousGraphVersionId: null, dependencyIds: ["SD-044"] } });
    expect(await new SkillGraphProjectionService(artifacts).get()).toMatchObject({ dependencies: [expect.objectContaining({ dependencyId: "SD-044" })], latestVersion: expect.objectContaining({ graphVersionId: "SG-V1" }) });
    expect((await audit.list("workspace:1")).map((entry) => entry.event.eventType)).toEqual(["SKILL_DEPENDENCY_ACCEPTED", "SKILL_GRAPH_VERSION_CREATED"]);
  });

  it("keeps an edge inactive when the gate defers or authorizes a different candidate", async () => {
    const artifacts = store();
    const service = new SkillDependencyAdmissionService(artifacts);
    await expect(service.admit({ dependency: dependency(), gateDecision: gate("DEFER"), workspaceId: "workspace:1", correlationId: "dependency:44", changeReason: "Pending review." })).resolves.toMatchObject({ outcome: "DEFER", persistenceEffect: "NONE" });
    await expect(new SkillGraphProjectionService(artifacts).get()).resolves.toMatchObject({ dependencies: [], latestVersion: null });
    await expect(service.admit({ dependency: dependency(), gateDecision: gate("ACCEPT", "another-candidate"), workspaceId: "workspace:1", correlationId: "dependency:44", changeReason: "Mismatched authorization." })).resolves.toMatchObject({ outcome: "DEFER", persistenceEffect: "NONE" });
    expect(artifacts.records.map((record) => record.artifactType)).toEqual(["DEPENDENCY_CANDIDATE"]);
  });
});

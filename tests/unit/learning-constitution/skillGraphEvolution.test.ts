import { describe, expect, it } from "vitest";
import { SkillDependencyAdmissionService, SkillDependencyCandidateDiscoveryService, SkillGraphEvolutionService, SkillGraphProjectionService } from "@/services/learning-constitution";
import type { GateDecision, SkillDependency, SkillGraphArtifactRecord, SkillGraphArtifactStore } from "@/types/learning-constitution";

const dependency = (id: string, version: string, rationale = "Validated relationship."): SkillDependency => ({ dependencyId: id, prerequisite: { skillId: "SK-DEPENDENCY" }, dependent: { skillId: "SK-ROADMAP" }, relationshipType: "PREREQUISITE", strength: 0.8, requiredMasteryThreshold: 70, evidenceIds: ["EV-1"], provenance: { provenanceIds: ["PR-1"], assertedBy: { actorId: "human:teacher", actorType: "HUMAN" }, assertedAt: "2026-09-01T00:00:00.000Z" }, lifecycle: "CANDIDATE", graphVersionId: version, rationale });
const gate = (candidateId: string): GateDecision => ({ evaluationId: `gate:${candidateId}`, candidateId, outcome: "ACCEPT", reasonCodes: [], checks: [], inputFingerprint: "fingerprint", context: { gateVersion: "9", constitutionVersion: "1", taxonomyVersion: "1", authorityPolicyVersion: "1", validationPolicyVersion: "1", conflictEngineVersion: "1", registryVersion: "18", learningIntent: "APPROVED", decisionActorId: "human:teacher" }, authorityEffect: "UNCHANGED", executionPermissionGranted: false });
const store = (): SkillGraphArtifactStore => { const records: SkillGraphArtifactRecord[] = []; return { append: async (artifact) => { const replay = records.find((item) => item.artifactId === artifact.artifactId); if (replay) return replay; records.push(artifact); return artifact; }, listWorkspaceArtifacts: async () => [...records] }; };

describe("Phase 19I graph evolution", () => {
  it("records a discovered relationship as a candidate only", async () => {
    const artifacts = store();
    const candidate = await new SkillDependencyCandidateDiscoveryService(artifacts).record({ candidate: dependency("SD-1", "SG-V1"), discoveryMethod: "COUNTERFACTUAL_EVIDENCE", supportingEvidenceIds: ["EV-COUNTERFACTUAL"] });
    expect(await new SkillGraphProjectionService(artifacts).get()).toMatchObject({ dependencies: [], latestVersion: null });
    await expect(new SkillDependencyAdmissionService(artifacts).admit({ dependency: candidate, gateDecision: gate(candidate.dependencyId), workspaceId: "workspace:1", correlationId: candidate.dependencyId, changeReason: "Human approved candidate." })).resolves.toMatchObject({ outcome: "ACCEPT" });
  });
  it("supersedes an active edge through human review and retains the old version in history", async () => {
    const artifacts = store();
    await new SkillDependencyAdmissionService(artifacts).admit({ dependency: dependency("SD-1", "SG-V1"), gateDecision: gate("SD-1"), workspaceId: "workspace:1", correlationId: "SD-1", changeReason: "Initial human review." });
    const version = await new SkillGraphEvolutionService(artifacts).supersede({ review: { reviewId: "HR-2", dependencyId: "SD-1", decision: "SUPERSEDE", actor: { actorId: "human:teacher", actorType: "HUMAN" }, reason: "Counterfactual evidence revised the relationship.", reviewedAt: "2026-09-01T01:00:00.000Z" }, supersessionId: "SS-1", replacement: dependency("SD-2", "SG-V2", "Revised relationship."), gateDecision: gate("SD-2"), workspaceId: "workspace:1", correlationId: "SS-1" });
    expect(version).toMatchObject({ graphVersionId: "SG-V2", previousGraphVersionId: "SG-V1", dependencyIds: ["SD-2"] });
    expect(await new SkillGraphProjectionService(artifacts).get()).toMatchObject({ dependencies: [expect.objectContaining({ dependencyId: "SD-2", lifecycle: "ACTIVE" })], latestVersion: expect.objectContaining({ graphVersionId: "SG-V2" }) });
  });
  it("requires a human reviewer and a matching accepted gate decision for supersession", async () => {
    const artifacts = store();
    await new SkillDependencyAdmissionService(artifacts).admit({ dependency: dependency("SD-1", "SG-V1"), gateDecision: gate("SD-1"), workspaceId: "workspace:1", correlationId: "SD-1", changeReason: "Initial human review." });
    await expect(new SkillGraphEvolutionService(artifacts).supersede({ review: { reviewId: "HR-2", dependencyId: "SD-1", decision: "SUPERSEDE", actor: { actorId: "agent:noesis", actorType: "AGENT" }, reason: "No human review.", reviewedAt: "2026-09-01T01:00:00.000Z" }, supersessionId: "SS-1", replacement: dependency("SD-2", "SG-V2"), gateDecision: gate("wrong"), workspaceId: "workspace:1", correlationId: "SS-1" })).rejects.toThrow("human review");
  });
});

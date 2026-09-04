import { describe, expect, it } from "vitest";
import { SkillBlastRadiusAnalysisService } from "@/services/learning-constitution";
import type { SkillDependency, SkillRegistryEntry } from "@/types/learning-constitution";

const entry = (skillId: string, mastery: number | null): SkillRegistryEntry => ({ skill: { skillId, name: skillId, description: "Test", domain: "Test", skillType: "ATOMIC", scope: [{ type: "PROJECT", id: "noesis" }], prerequisiteSkillIds: [], procedureIds: [], principleIds: [], evidence: [], mastery, confidence: "LOW", status: "UNDEMONSTRATED", limitations: [], failureModes: [], createdBy: { actorId: "human:teacher", actorType: "HUMAN" }, createdAt: "2026-09-01T00:00:00.000Z", immutable: true, capabilityClaim: false, executionPermissionGranted: false }, status: "VALIDATED", activeEvidenceCount: 0, revokedEvidenceCount: 0, evaluationCount: 1, assessment: { observedScore: mastery, estimatedMastery: mastery, confidence: "LOW", eligibleForProvisional: false, rationale: [], executionPermissionGranted: false }, lastReviewedAt: null, executionPermissionGranted: false });
const edge = (id: string, prerequisite: string, dependent: string): SkillDependency => ({ dependencyId: id, prerequisite: { skillId: prerequisite }, dependent: { skillId: dependent }, relationshipType: "PREREQUISITE", strength: 0.8, requiredMasteryThreshold: 70, evidenceIds: ["EV-1"], provenance: { provenanceIds: ["PR-1"], assertedBy: { actorId: "human:teacher", actorType: "HUMAN" }, assertedAt: "2026-09-01T00:00:00.000Z" }, lifecycle: "ACTIVE", graphVersionId: "SG-V1", rationale: "Validated relationship." });

describe("Phase 19H blast radius", () => {
  const graph = [edge("SD-1", "SK-DEPENDENCY", "SK-ROADMAP"), edge("SD-2", "SK-ROADMAP", "SK-ARCHITECTURE-ROADMAP"), edge("SD-3", "SK-DEPENDENCY", "SK-IMPLEMENTATION")];
  it("prioritizes direct and transitive reevaluation while preserving historical mastery", () => {
    const entries = new Map([["SK-DEPENDENCY", entry("SK-DEPENDENCY", 58)], ["SK-ROADMAP", entry("SK-ROADMAP", 82)], ["SK-ARCHITECTURE-ROADMAP", entry("SK-ARCHITECTURE-ROADMAP", 88)], ["SK-IMPLEMENTATION", entry("SK-IMPLEMENTATION", 90)]]);
    const result = new SkillBlastRadiusAnalysisService().analyze({ sourceSkillId: "SK-DEPENDENCY", trigger: "WEAKENED", dependencies: graph, registryEntries: entries });
    expect(result).toMatchObject({ status: "POTENTIAL_IMPACT", historicalMasteryChanged: false, directlyAffected: expect.arrayContaining([expect.objectContaining({ skillId: "SK-ROADMAP", depth: 1, revalidationRecommended: true }), expect.objectContaining({ skillId: "SK-IMPLEMENTATION", depth: 1 })]), potentiallyAffected: [expect.objectContaining({ skillId: "SK-ARCHITECTURE-ROADMAP", depth: 2 })] });
    expect(entries.get("SK-ARCHITECTURE-ROADMAP")?.assessment.estimatedMastery).toBe(88);
  });
  it("does not create a blast radius when current mastery satisfies all direct thresholds", () => {
    const entries = new Map([["SK-DEPENDENCY", entry("SK-DEPENDENCY", 82)]]);
    expect(new SkillBlastRadiusAnalysisService().analyze({ sourceSkillId: "SK-DEPENDENCY", trigger: "WEAKENED", dependencies: graph, registryEntries: entries })).toMatchObject({ status: "NO_IMPACT", directlyAffected: [], potentiallyAffected: [] });
  });
  it("propagates staleness as risk even without asserting a mastery failure", () => {
    const entries = new Map([["SK-DEPENDENCY", entry("SK-DEPENDENCY", null)]]);
    expect(new SkillBlastRadiusAnalysisService().analyze({ sourceSkillId: "SK-DEPENDENCY", trigger: "STALE", dependencies: graph, registryEntries: entries })).toMatchObject({ status: "POTENTIAL_IMPACT", directlyAffected: expect.arrayContaining([expect.objectContaining({ skillId: "SK-ROADMAP" })]) });
  });
});

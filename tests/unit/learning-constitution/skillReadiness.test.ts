import { describe, expect, it } from "vitest";
import { SkillReadinessService } from "@/services/learning-constitution";
import type { SkillDependency, SkillRegistryEntry } from "@/types/learning-constitution";

const entry = (skillId: string, status: SkillRegistryEntry["status"], mastery: number | null): SkillRegistryEntry => ({
  skill: { skillId, name: skillId, description: "Test skill", domain: "Test", skillType: "ATOMIC", scope: [{ type: "PROJECT", id: "noesis" }], prerequisiteSkillIds: [], procedureIds: [], principleIds: [], evidence: [], mastery, confidence: "LOW", status: "UNDEMONSTRATED", limitations: [], failureModes: [], createdBy: { actorId: "human:teacher", actorType: "HUMAN" }, createdAt: "2026-09-01T00:00:00.000Z", immutable: true, capabilityClaim: false, executionPermissionGranted: false },
  status, activeEvidenceCount: 0, revokedEvidenceCount: 0, evaluationCount: 0, assessment: { observedScore: mastery, estimatedMastery: mastery, confidence: "LOW", eligibleForProvisional: false, rationale: [], executionPermissionGranted: false }, lastReviewedAt: null, executionPermissionGranted: false,
});

const dependency: SkillDependency = {
  dependencyId: "SD-1", prerequisite: { skillId: "SK-DEPENDENCY" }, dependent: { skillId: "SK-ROADMAP" }, relationshipType: "PREREQUISITE", strength: 0.9, requiredMasteryThreshold: 70, evidenceIds: ["EV-1"], provenance: { provenanceIds: ["PR-1"], assertedBy: { actorId: "human:teacher", actorType: "HUMAN" }, assertedAt: "2026-09-01T00:00:00.000Z" }, lifecycle: "ACTIVE", graphVersionId: "SG-V1", rationale: "Required prior capability.",
};

describe("Phase 19E readiness", () => {
  it("locks a not-yet-demonstrated target behind a weak prerequisite without changing canonical mastery", () => {
    const entries = new Map([["SK-DEPENDENCY", entry("SK-DEPENDENCY", "VALIDATED", 58)], ["SK-ROADMAP", entry("SK-ROADMAP", "UNDEMONSTRATED", null)]]);
    const result = new SkillReadinessService().assess({ skillId: "SK-ROADMAP", dependencies: [dependency], registryEntries: entries });
    expect(result).toMatchObject({ state: "LOCKED", blocked: true, canonicalStatus: "UNDEMONSTRATED", prerequisiteHealth: [expect.objectContaining({ skillId: "SK-DEPENDENCY", observedMastery: 58, satisfied: false })] });
    expect(entries.get("SK-DEPENDENCY")?.assessment.estimatedMastery).toBe(58);
  });

  it("reports readiness separately from provisional or mastered canonical capability", () => {
    const entries = new Map([["SK-DEPENDENCY", entry("SK-DEPENDENCY", "VALIDATED", 82)], ["SK-ROADMAP", entry("SK-ROADMAP", "PROVISIONAL", 75)]]);
    expect(new SkillReadinessService().assess({ skillId: "SK-ROADMAP", dependencies: [dependency], registryEntries: entries })).toMatchObject({ state: "PROVISIONAL", blocked: false });
    entries.set("SK-ROADMAP", entry("SK-ROADMAP", "MASTERED", 93));
    expect(new SkillReadinessService().assess({ skillId: "SK-ROADMAP", dependencies: [dependency], registryEntries: entries })).toMatchObject({ state: "MASTERED", blocked: false });
  });

  it("degrades established capability when a critical prerequisite weakens and supports explicit remediation", () => {
    const entries = new Map([["SK-DEPENDENCY", entry("SK-DEPENDENCY", "VALIDATED", 62)], ["SK-ROADMAP", entry("SK-ROADMAP", "VALIDATED", 88)]]);
    const service = new SkillReadinessService();
    expect(service.assess({ skillId: "SK-ROADMAP", dependencies: [dependency], registryEntries: entries })).toMatchObject({ state: "DEGRADED", blocked: true, canonicalStatus: "VALIDATED" });
    expect(service.assess({ skillId: "SK-ROADMAP", dependencies: [dependency], registryEntries: entries, remediationActive: true })).toMatchObject({ state: "REMEDIATING", blocked: true });
  });
});

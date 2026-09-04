import { describe, expect, it } from "vitest";
import { SkillBottleneckDetectionService } from "@/services/learning-constitution";
import type { SkillDependency, SkillRegistryEntry } from "@/types/learning-constitution";

const entry = (skillId: string, mastery: number | null): SkillRegistryEntry => ({ skill: { skillId, name: skillId, description: "Test", domain: "Test", skillType: "ATOMIC", scope: [{ type: "PROJECT", id: "noesis" }], prerequisiteSkillIds: [], procedureIds: [], principleIds: [], evidence: [{ evidenceId: `EV-${skillId}`, skillId, outcome: "FAILURE", assistance: "INDEPENDENT", context: "test", provenanceId: `PR-${skillId}`, observedAt: "2026-09-01T00:00:00.000Z", revoked: false }], mastery, confidence: "LOW", status: "UNDEMONSTRATED", limitations: [], failureModes: [], createdBy: { actorId: "human:teacher", actorType: "HUMAN" }, createdAt: "2026-09-01T00:00:00.000Z", immutable: true, capabilityClaim: false, executionPermissionGranted: false }, status: "VALIDATED", activeEvidenceCount: 1, revokedEvidenceCount: 0, evaluationCount: 1, assessment: { observedScore: mastery, estimatedMastery: mastery, confidence: "LOW", eligibleForProvisional: false, rationale: [], executionPermissionGranted: false }, lastReviewedAt: null, executionPermissionGranted: false });
const edge = (id: string, prerequisite: string, dependent: string): SkillDependency => ({ dependencyId: id, prerequisite: { skillId: prerequisite }, dependent: { skillId: dependent }, relationshipType: "PREREQUISITE", strength: 0.8, requiredMasteryThreshold: 70, evidenceIds: [`EV-${id}`], provenance: { provenanceIds: [`PR-${id}`], assertedBy: { actorId: "human:teacher", actorType: "HUMAN" }, assertedAt: "2026-09-01T00:00:00.000Z" }, lifecycle: "ACTIVE", graphVersionId: "SG-V1", rationale: "Validated relationship." });

describe("Phase 19F bottleneck detection", () => {
  const graph = [edge("SD-1", "SK-DEPENDENCY", "SK-ROADMAP"), edge("SD-2", "SK-ROADMAP", "SK-ARCHITECTURE-ROADMAP")];
  it("ranks a weak reachable prerequisite as a hypothesis with its evidence and path", () => {
    const entries = new Map([["SK-DEPENDENCY", entry("SK-DEPENDENCY", 58)], ["SK-ROADMAP", entry("SK-ROADMAP", 82)], ["SK-ARCHITECTURE-ROADMAP", entry("SK-ARCHITECTURE-ROADMAP", null)]]);
    const diagnosis = new SkillBottleneckDetectionService().diagnose({ targetSkillId: "SK-ARCHITECTURE-ROADMAP", dependencies: graph, registryEntries: entries, failedEvaluationEvidenceIds: ["EV-FAILURE"] });
    expect(diagnosis).toMatchObject({ status: "RECOMMENDATION", hypotheses: [expect.objectContaining({ prerequisiteSkillId: "SK-DEPENDENCY", dependencyId: "SD-1", deficit: 12, attribution: "PREREQUISITE_DEFICIENCY" })], attributionAssessments: expect.arrayContaining([expect.objectContaining({ attribution: "PREREQUISITE_DEFICIENCY", status: "SUPPORTED" }), expect.objectContaining({ attribution: "EVALUATION_ERROR", status: "UNRESOLVED" })]) });
  });
  it("does not diagnose without stored failure evidence", () => {
    const entries = new Map([["SK-DEPENDENCY", entry("SK-DEPENDENCY", 58)]]);
    expect(new SkillBottleneckDetectionService().diagnose({ targetSkillId: "SK-ARCHITECTURE-ROADMAP", dependencies: graph, registryEntries: entries, failedEvaluationEvidenceIds: [] })).toMatchObject({ status: "INSUFFICIENT_EVIDENCE", hypotheses: [] });
  });
  it("does not force a graph cause when prerequisites are healthy", () => {
    const entries = new Map([["SK-DEPENDENCY", entry("SK-DEPENDENCY", 80)], ["SK-ROADMAP", entry("SK-ROADMAP", 82)]]);
    expect(new SkillBottleneckDetectionService().diagnose({ targetSkillId: "SK-ARCHITECTURE-ROADMAP", dependencies: graph, registryEntries: entries, failedEvaluationEvidenceIds: ["EV-FAILURE"] })).toMatchObject({ status: "NOT_LOCALIZED", hypotheses: [], attributionAssessments: expect.arrayContaining([expect.objectContaining({ attribution: "PREREQUISITE_DEFICIENCY", status: "NOT_SUPPORTED" })]) });
  });
});

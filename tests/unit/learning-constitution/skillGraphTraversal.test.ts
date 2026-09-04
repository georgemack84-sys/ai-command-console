import { describe, expect, it } from "vitest";
import { SkillGraphTraversalService } from "@/services/learning-constitution";
import type { SkillDependency } from "@/types/learning-constitution";

const edge = (dependencyId: string, prerequisiteId: string, dependentId: string, relationshipType: SkillDependency["relationshipType"] = "PREREQUISITE"): SkillDependency => ({
  dependencyId,
  prerequisite: { skillId: prerequisiteId },
  dependent: { skillId: dependentId },
  relationshipType,
  strength: 0.8,
  requiredMasteryThreshold: relationshipType === "PREREQUISITE" ? 70 : null,
  evidenceIds: ["EV-1"],
  provenance: { provenanceIds: ["PR-1"], assertedBy: { actorId: "human:teacher", actorType: "HUMAN" }, assertedAt: "2026-09-01T00:00:00.000Z" },
  lifecycle: "ACTIVE",
  graphVersionId: "SG-V1",
  rationale: "Validated relationship.",
});

const graph = [
  edge("SD-1", "SK-REQUIREMENTS", "SK-DECOMPOSITION"),
  edge("SD-2", "SK-DECOMPOSITION", "SK-DEPENDENCY-ANALYSIS"),
  edge("SD-3", "SK-DEPENDENCY-ANALYSIS", "SK-ROADMAP"),
  edge("SD-4", "SK-ROADMAP", "SK-ARCHITECTURE-ROADMAP"),
  edge("SD-5", "SK-ESTIMATION", "SK-ROADMAP", "SUPPORTING"),
];

describe("Phase 19D graph traversal", () => {
  it("returns upstream prerequisite depth and complete root-to-target paths", () => {
    const result = new SkillGraphTraversalService().upstream("SK-ARCHITECTURE-ROADMAP", graph);
    expect(result.direct).toEqual([{ skillId: "SK-ROADMAP", depth: 1, viaDependencyIds: ["SD-4"] }]);
    expect(result.transitive).toEqual([
      { skillId: "SK-ROADMAP", depth: 1, viaDependencyIds: ["SD-4"] },
      { skillId: "SK-DEPENDENCY-ANALYSIS", depth: 2, viaDependencyIds: ["SD-4", "SD-3"] },
      { skillId: "SK-DECOMPOSITION", depth: 3, viaDependencyIds: ["SD-4", "SD-3", "SD-2"] },
      { skillId: "SK-REQUIREMENTS", depth: 4, viaDependencyIds: ["SD-4", "SD-3", "SD-2", "SD-1"] },
    ]);
    expect(result.paths).toEqual([{ skillIds: ["SK-ARCHITECTURE-ROADMAP", "SK-ROADMAP", "SK-DEPENDENCY-ANALYSIS", "SK-DECOMPOSITION", "SK-REQUIREMENTS"], dependencyIds: ["SD-4", "SD-3", "SD-2", "SD-1"] }]);
  });

  it("returns downstream blast radius while excluding non-prerequisite edges by default", () => {
    const service = new SkillGraphTraversalService();
    expect(service.downstream("SK-DECOMPOSITION", graph).transitive.map((entry) => [entry.skillId, entry.depth])).toEqual([["SK-DEPENDENCY-ANALYSIS", 1], ["SK-ROADMAP", 2], ["SK-ARCHITECTURE-ROADMAP", 3]]);
    expect(service.upstream("SK-ROADMAP", graph).transitive.map((entry) => entry.skillId)).not.toContain("SK-ESTIMATION");
    expect(service.upstream("SK-ROADMAP", graph, ["PREREQUISITE", "SUPPORTING"]).transitive.map((entry) => entry.skillId)).toContain("SK-ESTIMATION");
  });

  it("guards traversal against a malformed cycle", () => {
    const cyclic = [...graph, edge("SD-6", "SK-ARCHITECTURE-ROADMAP", "SK-REQUIREMENTS")];
    expect(new SkillGraphTraversalService().transitiveClosure("SK-REQUIREMENTS", cyclic, "DOWNSTREAM")).toEqual(["SK-DECOMPOSITION", "SK-DEPENDENCY-ANALYSIS", "SK-ROADMAP", "SK-ARCHITECTURE-ROADMAP"]);
  });
});

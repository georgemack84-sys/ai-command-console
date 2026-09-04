import { describe, expect, it } from "vitest";
import { SkillGraphIntegrityService } from "@/services/learning-constitution";
import type { SkillDependency } from "@/types/learning-constitution";

const edge = (dependencyId: string, prerequisiteId: string, dependentId: string, overrides: Partial<SkillDependency> = {}): SkillDependency => ({
  dependencyId,
  prerequisite: { skillId: prerequisiteId },
  dependent: { skillId: dependentId },
  relationshipType: "PREREQUISITE",
  strength: 0.8,
  requiredMasteryThreshold: 70,
  evidenceIds: ["EV-1"],
  provenance: { provenanceIds: ["PR-1"], assertedBy: { actorId: "human:teacher", actorType: "HUMAN" }, assertedAt: "2026-09-01T00:00:00.000Z" },
  lifecycle: "CANDIDATE",
  graphVersionId: "SG-V1",
  rationale: "Validated prerequisite relationship.",
  ...overrides,
});

describe("Phase 19C graph integrity", () => {
  it("accepts an acyclic graph over canonical skills", () => {
    expect(new SkillGraphIntegrityService().inspect([edge("SD-1", "SK-A", "SK-B"), edge("SD-2", "SK-B", "SK-C")], new Set(["SK-A", "SK-B", "SK-C"]))).toEqual({ valid: true, violations: [] });
  });

  it("detects missing skills, duplicate relationships, and malformed thresholds", () => {
    const report = new SkillGraphIntegrityService().inspect([edge("SD-1", "SK-A", "SK-B"), edge("SD-2", "SK-A", "SK-B", { requiredMasteryThreshold: 101 }), edge("SD-3", "SK-MISSING", "SK-B")], new Set(["SK-A", "SK-B"]));
    expect(report).toMatchObject({ valid: false, violations: expect.arrayContaining([
      expect.objectContaining({ code: "DUPLICATE_DEPENDENCY", dependencyIds: ["SD-1", "SD-2"] }),
      expect.objectContaining({ code: "PREREQUISITE_THRESHOLD_INVALID", dependencyIds: ["SD-2"] }),
      expect.objectContaining({ code: "CANONICAL_SKILL_MISSING", dependencyIds: ["SD-3"] }),
    ]) });
  });

  it("rejects arbitrary-depth hard prerequisite cycles", () => {
    const report = new SkillGraphIntegrityService().inspect([edge("SD-1", "SK-A", "SK-B"), edge("SD-2", "SK-B", "SK-C"), edge("SD-3", "SK-C", "SK-A")], new Set(["SK-A", "SK-B", "SK-C"]));
    expect(report.violations).toContainEqual(expect.objectContaining({ code: "HARD_PREREQUISITE_CYCLE", dependencyIds: expect.arrayContaining(["SD-1", "SD-2", "SD-3"]) }));
  });
});

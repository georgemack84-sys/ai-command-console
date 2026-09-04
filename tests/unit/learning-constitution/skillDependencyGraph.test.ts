import { describe, expect, it } from "vitest";
import { SkillDependencyGraphValidator } from "@/services/learning-constitution";
import type { SkillDependency } from "@/types/learning-constitution";

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
  rationale: "Sequencing constraints must be understood before a reliable roadmap can be produced.",
  ...overrides,
});

describe("Phase 19A skill dependency domain", () => {
  it("models evidenced, versioned prerequisites over canonical Phase 18 skills", () => {
    expect(new SkillDependencyGraphValidator().validate(dependency())).toEqual({ dependencyId: "SD-044", valid: true, reasonCodes: ["SKILL_DEPENDENCY_VALID"] });
  });

  it("rejects malformed and self-referential dependencies without changing skill mastery", () => {
    const invalid = dependency({ prerequisite: { skillId: "SK-ROADMAP-PLANNING" }, strength: 1.2, requiredMasteryThreshold: 101, evidenceIds: [] });
    expect(new SkillDependencyGraphValidator().validate(invalid)).toMatchObject({ valid: false, reasonCodes: expect.arrayContaining(["SELF_DEPENDENCY_FORBIDDEN", "DEPENDENCY_STRENGTH_INVALID", "PREREQUISITE_THRESHOLD_INVALID", "DEPENDENCY_EVIDENCE_REQUIRED"]) });
  });

  it("prevents thresholds from being assigned to non-prerequisite relationships", () => {
    expect(new SkillDependencyGraphValidator().validate(dependency({ relationshipType: "SUPPORTING", requiredMasteryThreshold: 70 }))).toMatchObject({ valid: false, reasonCodes: ["NON_PREREQUISITE_THRESHOLD_FORBIDDEN"] });
  });
});

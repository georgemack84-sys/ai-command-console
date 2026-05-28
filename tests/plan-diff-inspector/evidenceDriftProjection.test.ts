import { describe, expect, it } from "vitest";
import { buildPlanDiffFixture, projectEvidenceDrift } from "./helpers";

describe("evidence drift projection", () => {
  it("keeps missing or unverifiable evidence visible", () => {
    const fixture = buildPlanDiffFixture({
      comparisonMode: "EVIDENCE_BUNDLE",
    });
    const view = projectEvidenceDrift({
      baseArtifact: fixture.baseArtifact,
      targetArtifact: fixture.targetArtifact,
    });

    expect(view.driftClass).toBe("EVIDENCE_DRIFT");
    expect(view.unverifiableEvidenceRefs).toContain("unknown-evidence-ref");
  });
});

import { describe, expect, it } from "vitest";
import { buildPlanDiffFixture, projectGovernanceDrift } from "./helpers";

describe("governance drift projection", () => {
  it("detects governance-facing drift fields", () => {
    const fixture = buildPlanDiffFixture();
    const view = projectGovernanceDrift({
      baseArtifact: fixture.baseArtifact,
      targetArtifact: fixture.targetArtifact,
    });

    expect(view.driftClass).toBe("GOVERNANCE_DRIFT");
    expect(view.changedFields).toEqual(
      expect.arrayContaining(["riskTier", "trustZone", "approvalRequirements"]),
    );
  });
});

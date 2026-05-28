import { describe, expect, it } from "vitest";
import { buildPlanDiffFixture } from "./helpers";

describe("reuse policy-decision-explainer artifacts", () => {
  it("consumes existing policy explanation artifacts instead of recomputing governance truth", () => {
    const fixture = buildPlanDiffFixture({
      comparisonMode: "POLICY_BINDING",
    });

    expect(fixture.baseArtifact.policyExplanation).toBeTruthy();
    expect(fixture.inspection.evidenceDrift.visibleEvidenceCount).toBeGreaterThan(0);
  });
});

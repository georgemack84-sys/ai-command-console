import { describe, expect, it } from "vitest";
import { buildPlanDiffInspection } from "@/services/plan-diff-inspector";
import { buildPlanDiffFixture } from "./helpers";

describe("unknown drift fails closed", () => {
  it("marks unknown drift as unsafe instead of guessing", () => {
    const fixture = buildPlanDiffFixture({
      baseArtifact: { left: "plain" },
      targetArtifact: { right: "plain" },
      comparisonMode: "POLICY_BINDING",
    });

    const result = buildPlanDiffInspection(fixture.input);

    expect(result.result).toBe("UNSAFE_DRIFT");
    expect(result.errors).toContain("PLAN_DIFF_UNKNOWN_DRIFT");
  });
});

import { describe, expect, it } from "vitest";
import { buildDecisionReadinessCertificationFixture } from "@/tests/integration/decision-readiness-certification/helpers";

describe("decision readiness operator authority", () => {
  it("preserves operator supremacy and emergency stop compatibility", () => {
    const fixture = buildDecisionReadinessCertificationFixture();

    expect(fixture.result.operatorRecord.operatorSupremacyVerified).toBe(true);
    expect(fixture.result.containmentRecord.transitionVisibilityVerified).toBe(true);
  });
});

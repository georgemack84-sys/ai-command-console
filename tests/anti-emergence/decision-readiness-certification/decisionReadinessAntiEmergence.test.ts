import { describe, expect, it } from "vitest";
import { buildDecisionReadinessCertificationFixture } from "@/tests/integration/decision-readiness-certification/helpers";

describe("decision readiness anti-emergence", () => {
  it("freezes recursive recommendation chains", () => {
    const fixture = buildDecisionReadinessCertificationFixture({
      metadata: Object.freeze({ recursiveRecommendationChain: true }),
    });

    expect(fixture.result.freeze.frozen).toBe(true);
    expect(fixture.result.errors.map((error) => error.code)).toContain("DECISION_READINESS_ANTI_EMERGENCE");
  });
});

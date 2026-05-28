import { describe, expect, it } from "vitest";
import { buildDecisionIntentBoundaryFixture } from "@/tests/integration/decision-intent-boundary/helpers";

describe("decision intent boundary fail closed", () => {
  it("lowers confidence and preserves operator review under uncertainty", () => {
    const fixture = buildDecisionIntentBoundaryFixture({
      summary: "recommend and execute after review",
      metadata: Object.freeze({
        semanticDrift: true,
      }),
    });

    expect(fixture.result.aggregation.failClosed).toBe(true);
    expect(fixture.result.artifact.operatorReviewRequired).toBe(true);
    expect(fixture.result.artifact.confidence.score).toBeLessThan(0.8);
  });
});

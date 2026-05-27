import { describe, expect, it } from "vitest";
import { buildDecisionIntentBoundaryFixture } from "@/tests/integration/decision-intent-boundary/helpers";

describe("decision intent boundary integration", () => {
  it("builds an advisory-only intent artifact with immutable lineage", () => {
    const fixture = buildDecisionIntentBoundaryFixture();

    expect(fixture.result.artifact.advisoryOnly).toBe(true);
    expect(fixture.result.artifact.executable).toBe(false);
    expect(fixture.result.artifact.operatorReviewRequired).toBe(true);
    expect(fixture.result.lineage.entries.length).toBe(1);
    expect(fixture.result.replayLedger.length).toBe(2);
  });
});

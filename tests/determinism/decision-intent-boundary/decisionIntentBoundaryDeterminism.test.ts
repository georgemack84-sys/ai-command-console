import { describe, expect, it } from "vitest";
import { buildDecisionIntentBoundaryFixture } from "@/tests/integration/decision-intent-boundary/helpers";

describe("decision intent boundary determinism", () => {
  it("produces identical confidence and risk outputs for identical inputs", () => {
    const first = buildDecisionIntentBoundaryFixture();
    const second = buildDecisionIntentBoundaryFixture();

    expect(first.result.artifact.confidence.score).toBe(second.result.artifact.confidence.score);
    expect(first.result.artifact.risk.level).toBe(second.result.artifact.risk.level);
  });
});

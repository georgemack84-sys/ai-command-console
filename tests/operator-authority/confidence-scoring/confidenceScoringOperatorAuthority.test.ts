import { describe, expect, it } from "vitest";
import { buildConfidenceScoringFixture } from "@/tests/integration/confidence-scoring/helpers";

describe("confidence scoring operator supremacy", () => {
  it("keeps operator decision required immutable", () => {
    const fixture = buildConfidenceScoringFixture();
    expect(fixture.result.confidenceScores.every((score) => score.operatorDecisionRequired)).toBe(true);
  });
});

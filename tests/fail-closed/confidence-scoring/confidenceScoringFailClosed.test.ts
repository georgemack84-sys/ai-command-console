import { describe, expect, it } from "vitest";
import { buildConfidenceScoringFixture } from "@/tests/integration/confidence-scoring/helpers";

describe("confidence scoring fail-closed behavior", () => {
  it("freezes and reduces confidence when evidence is missing", () => {
    const base = buildConfidenceScoringFixture();
    const fixture = buildConfidenceScoringFixture({
      evidenceAggregationResult: Object.freeze({
        ...base.input.evidenceAggregationResult,
        evidenceReferences: Object.freeze([]),
      }),
    });

    expect(fixture.result.freeze.frozen).toBe(true);
    expect(fixture.result.errors.some((error) => error.code === "CONFIDENCE_SCORING_MISSING_EVIDENCE")).toBe(true);
    expect(fixture.result.confidenceScores[0]?.confidenceLevel).toBe("very_low");
  });
});

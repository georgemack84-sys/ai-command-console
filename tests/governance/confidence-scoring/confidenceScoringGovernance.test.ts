import { describe, expect, it } from "vitest";
import { buildConfidenceScoringFixture } from "@/tests/integration/confidence-scoring/helpers";

describe("confidence scoring governance handling", () => {
  it("reduces confidence and freezes on governance ambiguity", () => {
    const base = buildConfidenceScoringFixture();
    const fixture = buildConfidenceScoringFixture({
      recommendationSynthesisInput: Object.freeze({
        ...base.input.recommendationSynthesisInput,
        recommendationValidationResult: Object.freeze({
          ...base.input.recommendationSynthesisInput.recommendationValidationResult,
          result: Object.freeze({
            ...base.input.recommendationSynthesisInput.recommendationValidationResult.result,
            governanceValidated: false,
          }),
        }),
      }),
    });

    expect(fixture.result.freeze.frozen).toBe(true);
    expect(fixture.result.errors.some((error) => error.code === "CONFIDENCE_SCORING_GOVERNANCE_AMBIGUITY")).toBe(true);
    expect(fixture.result.confidenceScores[0]?.overallConfidence).toBeLessThanOrEqual(0.15);
  });
});

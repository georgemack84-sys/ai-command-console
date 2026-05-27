import { describe, expect, it } from "vitest";
import { buildConfidenceScoringFixture } from "@/tests/integration/confidence-scoring/helpers";

describe("confidence scoring adversarial behavior", () => {
  it("freezes on operator-suppressed recommendation visibility", () => {
    const base = buildConfidenceScoringFixture();
    const fixture = buildConfidenceScoringFixture({
      recommendationSynthesisInput: Object.freeze({
        ...base.input.recommendationSynthesisInput,
        operatorAuthorityResult: Object.freeze({
          ...base.input.recommendationSynthesisInput.operatorAuthorityResult,
          action: Object.freeze({
            ...base.input.recommendationSynthesisInput.operatorAuthorityResult.action,
            actionType: "FREEZE",
          }),
        }),
      }),
    });

    expect(fixture.result.freeze.frozen).toBe(true);
    expect(fixture.result.errors.some((error) => error.code === "CONFIDENCE_SCORING_OPERATOR_SUPPRESSED")).toBe(true);
  });
});

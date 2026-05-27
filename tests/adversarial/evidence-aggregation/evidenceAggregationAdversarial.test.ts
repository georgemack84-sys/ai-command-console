import { describe, expect, it } from "vitest";
import { buildEvidenceAggregationFixture } from "@/tests/integration/evidence-aggregation/helpers";

describe("evidence aggregation adversarial handling", () => {
  it("freezes on operator suppression action", () => {
    const base = buildEvidenceAggregationFixture();
    const fixture = buildEvidenceAggregationFixture({
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
    expect(fixture.result.errors.some((error) => error.code === "EVIDENCE_AGGREGATION_OPERATOR_SUPPRESSED")).toBe(true);
  });
});

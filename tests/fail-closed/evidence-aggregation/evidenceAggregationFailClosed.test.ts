import { describe, expect, it } from "vitest";
import { buildEvidenceAggregationFixture } from "@/tests/integration/evidence-aggregation/helpers";

describe("evidence aggregation fail-closed", () => {
  it("freezes on governance ambiguity", () => {
    const base = buildEvidenceAggregationFixture();
    const fixture = buildEvidenceAggregationFixture({
      recommendationSynthesisInput: Object.freeze({
        ...base.input.recommendationSynthesisInput,
        constitutionalTransitionResult: Object.freeze({
          ...base.input.recommendationSynthesisInput.constitutionalTransitionResult,
          transition: Object.freeze({
            ...base.input.recommendationSynthesisInput.constitutionalTransitionResult.transition,
            governanceBasisId: "spoofed-governance",
          }),
        }),
      }),
    });

    expect(fixture.result.freeze.frozen).toBe(true);
    expect(fixture.result.errors.some((error) => error.code === "EVIDENCE_AGGREGATION_GOVERNANCE_AMBIGUITY")).toBe(true);
  });
});

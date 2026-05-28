import { describe, expect, it } from "vitest";
import { buildEvidenceAggregationFixture } from "@/tests/integration/evidence-aggregation/helpers";

describe("evidence aggregation anti-emergence", () => {
  it("freezes on hidden execution carry-through", () => {
    const base = buildEvidenceAggregationFixture();
    const fixture = buildEvidenceAggregationFixture({
      recommendationSynthesisInput: Object.freeze({
        ...base.input.recommendationSynthesisInput,
        hiddenExecutionDetectionResult: Object.freeze({
          ...base.input.recommendationSynthesisInput.hiddenExecutionDetectionResult,
          report: Object.freeze({
            ...base.input.recommendationSynthesisInput.hiddenExecutionDetectionResult.report,
            blocked: true,
            scanPassed: false,
            scanStatus: "blocked",
            blockReasons: ["hidden_execution_detected"],
          }),
        }),
      }),
    });

    expect(fixture.result.freeze.frozen).toBe(true);
    expect(fixture.result.errors.some((error) => error.code === "EVIDENCE_AGGREGATION_HIDDEN_EXECUTION")).toBe(true);
  });
});

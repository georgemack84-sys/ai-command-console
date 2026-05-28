import { describe, expect, it } from "vitest";
import { buildRecommendationSynthesisFixture } from "@/tests/integration/recommendation-synthesis/helpers";

describe("recommendation synthesis adversarial handling", () => {
  it("freezes on hidden execution signals carried by upstream detection", () => {
    const base = buildRecommendationSynthesisFixture();
    const fixture = buildRecommendationSynthesisFixture({
      hiddenExecutionDetectionResult: Object.freeze({
        ...base.input.hiddenExecutionDetectionResult,
        report: Object.freeze({
          ...base.input.hiddenExecutionDetectionResult.report,
          blocked: true,
          escalationRequired: true,
          scanPassed: false,
          scanStatus: "blocked",
          blockReasons: ["hidden_execution_detected"],
        }),
      }),
    });

    expect(fixture.result.freeze.frozen).toBe(true);
    expect(fixture.result.errors.some((error) => error.code === "RECOMMENDATION_SYNTHESIS_HIDDEN_EXECUTION")).toBe(true);
  });
});

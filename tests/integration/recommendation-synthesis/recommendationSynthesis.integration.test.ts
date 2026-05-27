import { describe, expect, it } from "vitest";
import { buildRecommendationSynthesisFixture } from "./helpers";

describe("recommendation synthesis integration", () => {
  it("binds governance and replay metadata from upstream constitutional slices", () => {
    const fixture = buildRecommendationSynthesisFixture();
    const envelope = fixture.result.recommendations[0];

    expect(envelope?.governanceBindings[0]?.governanceSnapshotId).toBe(
      fixture.input.recommendationValidationResult.result.governanceSnapshotId,
    );
    expect(envelope?.replayMetadata.replayHash).toBe(
      fixture.input.deterministicReplayResult.result.replayHash,
    );
  });

  it("freezes when hidden execution prevention upstream is blocked", () => {
    const blockedFixture = buildRecommendationSynthesisFixture({
      hiddenExecutionDetectionResult: Object.freeze({
        ...buildRecommendationSynthesisFixture().input.hiddenExecutionDetectionResult,
        report: Object.freeze({
          ...buildRecommendationSynthesisFixture().input.hiddenExecutionDetectionResult.report,
          blocked: true,
          scanPassed: false,
          scanStatus: "blocked",
          blockReasons: ["hidden_execution_detected"],
        }),
      }),
    });

    expect(blockedFixture.result.freeze.frozen).toBe(true);
    expect(blockedFixture.result.recommendations).toHaveLength(0);
  });
});

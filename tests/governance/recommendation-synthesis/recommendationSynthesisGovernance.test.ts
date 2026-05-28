import { describe, expect, it } from "vitest";
import { buildRecommendationSynthesisFixture } from "@/tests/integration/recommendation-synthesis/helpers";

describe("recommendation synthesis governance preservation", () => {
  it("preserves the certified governance snapshot binding", () => {
    const fixture = buildRecommendationSynthesisFixture();
    const envelope = fixture.result.recommendations[0];

    expect(envelope?.governanceBindings[0]?.governanceSnapshotId).toBe(
      fixture.input.decisionReadinessCertificationResult.governanceRecord.governanceSnapshotId,
    );
  });
});

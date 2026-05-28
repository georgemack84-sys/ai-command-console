import { describe, expect, it } from "vitest";
import { buildRecommendationSynthesisFixture } from "@/tests/integration/recommendation-synthesis/helpers";

describe("recommendation synthesis engine", () => {
  it("produces a deterministic bounded recommendation on the certified happy path", () => {
    const fixture = buildRecommendationSynthesisFixture();

    expect(fixture.result.freeze.frozen).toBe(false);
    expect(fixture.result.recommendations).toHaveLength(1);
    expect(fixture.result.recommendations[0]?.recommendation.executionAuthorized).toBe(false);
    expect(fixture.result.recommendations[0]?.recommendation.summary).toContain("proposal");
  });

  it("preserves executionAuthorized false across every output layer", () => {
    const fixture = buildRecommendationSynthesisFixture();
    const envelope = fixture.result.recommendations[0];

    expect(envelope?.executionAuthorized).toBe(false);
    expect(envelope?.recommendation.executionAuthorized).toBe(false);
  });
});

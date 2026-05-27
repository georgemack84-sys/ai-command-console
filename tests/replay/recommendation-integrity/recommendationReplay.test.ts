import { describe, expect, it } from "vitest";

import { buildRecommendationIntegrityFixture } from "@/tests/integration/recommendation-integrity/helpers";

describe("recommendation replay", () => {
  it("fails closed on replay repair markers", () => {
    const fixture = buildRecommendationIntegrityFixture({
      metadata: Object.freeze({ replayRepair: true }),
    });
    expect(fixture.result.record.failClosed).toBe(true);
    expect(fixture.result.errors.map((error) => error.code)).toContain("RECOMMENDATION_REPLAY_REPAIR_ATTEMPT");
  });
});

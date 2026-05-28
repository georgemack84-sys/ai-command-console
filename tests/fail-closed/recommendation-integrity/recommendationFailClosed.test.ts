import { describe, expect, it } from "vitest";

import { buildRecommendationIntegrityFixture } from "@/tests/integration/recommendation-integrity/helpers";

describe("recommendation fail-closed behavior", () => {
  it("fails closed when upstream attack simulation is already fail-closed", () => {
    const fixture = buildRecommendationIntegrityFixture({
      metadata: Object.freeze({ executionImport: true }),
    });
    expect(fixture.result.record.recommendationState).toBe("FAIL_CLOSED");
    expect(fixture.result.record.failClosed).toBe(true);
  });
});

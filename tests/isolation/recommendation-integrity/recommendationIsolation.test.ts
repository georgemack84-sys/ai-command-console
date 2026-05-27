import { describe, expect, it } from "vitest";

import { buildRecommendationIntegrityFixture } from "@/tests/integration/recommendation-integrity/helpers";

describe("recommendation isolation", () => {
  it("fails closed on execution import attempts", () => {
    const fixture = buildRecommendationIntegrityFixture({
      metadata: Object.freeze({ executionImport: true, schedulerImport: true }),
    });
    expect(fixture.result.record.failClosed).toBe(true);
    expect(fixture.result.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      "RECOMMENDATION_ISOLATION_VIOLATION",
      "RECOMMENDATION_RUNTIME_MUTATION_ATTEMPT",
    ]));
  });
});

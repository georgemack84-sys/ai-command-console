import { describe, expect, it } from "vitest";

import { buildRecommendationIntegrityFixture } from "@/tests/integration/recommendation-integrity/helpers";

describe("recommendation integrity security", () => {
  it("rejects runtime mutation attempts", () => {
    const fixture = buildRecommendationIntegrityFixture({
      metadata: Object.freeze({ mutateRuntime: true, orchestrationImport: true }),
    });
    expect(fixture.result.record.failClosed).toBe(true);
    expect(fixture.result.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      "RECOMMENDATION_RUNTIME_MUTATION_ATTEMPT",
      "RECOMMENDATION_ISOLATION_VIOLATION",
    ]));
  });
});

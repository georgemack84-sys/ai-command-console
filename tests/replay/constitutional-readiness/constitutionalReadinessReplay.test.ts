import { describe, expect, it } from "vitest";
import { buildConstitutionalReadinessFixture } from "@/tests/integration/constitutional-readiness/helpers";

describe("constitutional readiness replay", () => {
  it("freezes on replay corruption or substitution markers", () => {
    const fixture = buildConstitutionalReadinessFixture({
      metadata: Object.freeze({ replayCorruption: true, currentStateSubstitution: true }),
    });

    expect(fixture.result.record.readinessClassification).toBe("FROZEN");
    expect(fixture.result.errors.some((item) => item.code.includes("REPLAY"))).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { buildConstitutionalReplayStabilityFixture } from "@/tests/integration/constitutional-replay-stability/helpers";

describe("constitutional replay stability governance", () => {
  it("fails closed on governance substitution", () => {
    const fixture = buildConstitutionalReplayStabilityFixture({
      metadata: Object.freeze({ governanceSubstitution: true }),
    });

    expect(["FROZEN", "INVALID"]).toContain(fixture.result.record.classification);
  });
});

import { describe, expect, it } from "vitest";
import { buildConstitutionalReplayStabilityFixture } from "@/tests/integration/constitutional-replay-stability/helpers";

describe("constitutional replay stability drift", () => {
  it("disputes on replay drift", () => {
    const fixture = buildConstitutionalReplayStabilityFixture({
      metadata: Object.freeze({ confidenceCorruption: true }),
    });

    expect(["FROZEN", "DISPUTED"]).toContain(fixture.result.record.classification);
  });
});

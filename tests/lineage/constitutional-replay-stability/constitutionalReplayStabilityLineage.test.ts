import { describe, expect, it } from "vitest";
import { buildConstitutionalReplayStabilityFixture } from "@/tests/integration/constitutional-replay-stability/helpers";

describe("constitutional replay stability lineage", () => {
  it("disputes on lineage break", () => {
    const fixture = buildConstitutionalReplayStabilityFixture({
      metadata: Object.freeze({ fabricatedLineage: true, staleSnapshot: true }),
    });

    expect(["DISPUTED", "FROZEN"]).toContain(fixture.result.record.classification);
  });
});

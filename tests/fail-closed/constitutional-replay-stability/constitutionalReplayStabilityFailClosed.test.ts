import { describe, expect, it } from "vitest";
import { buildConstitutionalReplayStabilityFixture } from "@/tests/integration/constitutional-replay-stability/helpers";
import { buildConstitutionalAuthorityBoundaryFixture } from "@/tests/integration/constitutional-authority-boundary/helpers";

describe("constitutional replay stability fail-closed", () => {
  it("inherits revoked authority containment as replay failure", () => {
    const boundary = buildConstitutionalAuthorityBoundaryFixture({
      metadata: Object.freeze({ governanceBypass: true }),
    }).result;
    const fixture = buildConstitutionalReplayStabilityFixture({
      constitutionalAuthorityBoundaryResult: boundary,
    });

    expect(fixture.result.record.failClosed).toBe(true);
    expect(["FROZEN", "INVALID", "REVOKED", "DISPUTED"]).toContain(fixture.result.record.classification);
  });
});

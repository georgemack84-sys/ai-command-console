import { describe, expect, it } from "vitest";
import { buildConstitutionalAuthorityBoundaryFixture } from "@/tests/integration/constitutional-authority-boundary/helpers";

describe("constitutional authority boundary replay", () => {
  it("fails closed on replay corruption", () => {
    const fixture = buildConstitutionalAuthorityBoundaryFixture({
      metadata: Object.freeze({ replayCorruption: true }),
    });

    expect(["FROZEN", "REVOKED"]).toContain(fixture.result.record.certificationState);
  });
});

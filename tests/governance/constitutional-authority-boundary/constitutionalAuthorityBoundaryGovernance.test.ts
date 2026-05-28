import { describe, expect, it } from "vitest";
import { buildConstitutionalAuthorityBoundaryFixture } from "@/tests/integration/constitutional-authority-boundary/helpers";

describe("constitutional authority boundary governance", () => {
  it("fails closed on governance bypass", () => {
    const fixture = buildConstitutionalAuthorityBoundaryFixture({
      metadata: Object.freeze({ governanceBypass: true }),
    });

    expect(["FROZEN", "REVOKED"]).toContain(fixture.result.record.certificationState);
  });
});

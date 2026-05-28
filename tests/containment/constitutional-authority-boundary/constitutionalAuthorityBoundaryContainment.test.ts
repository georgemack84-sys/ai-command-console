import { describe, expect, it } from "vitest";
import { buildConstitutionalAuthorityBoundaryFixture } from "@/tests/integration/constitutional-authority-boundary/helpers";

describe("constitutional authority boundary containment", () => {
  it("revokes on containment degradation", () => {
    const fixture = buildConstitutionalAuthorityBoundaryFixture({
      metadata: Object.freeze({ containmentDegradation: true }),
    });

    expect(["FROZEN", "REVOKED", "INVALID"]).toContain(fixture.result.record.certificationState);
  });
});

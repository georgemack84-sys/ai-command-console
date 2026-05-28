import { describe, expect, it } from "vitest";
import { buildConstitutionalAuthorityBoundaryFixture } from "@/tests/integration/constitutional-authority-boundary/helpers";

describe("constitutional authority boundary adversarial", () => {
  it("invalidates synthetic authority injection", () => {
    const fixture = buildConstitutionalAuthorityBoundaryFixture({
      metadata: Object.freeze({ syntheticAuthority: true }),
    });

    expect(fixture.result.record.certificationState).toBe("INVALID");
  });
});

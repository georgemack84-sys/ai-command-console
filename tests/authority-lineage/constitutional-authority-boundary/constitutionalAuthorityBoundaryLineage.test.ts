import { describe, expect, it } from "vitest";
import { buildConstitutionalAuthorityBoundaryFixture } from "@/tests/integration/constitutional-authority-boundary/helpers";

describe("constitutional authority boundary lineage", () => {
  it("disputes on fabricated lineage", () => {
    const fixture = buildConstitutionalAuthorityBoundaryFixture({
      metadata: Object.freeze({ fabricatedLineage: true, authorityAmbiguity: true }),
    });

    expect(["DISPUTED", "REVOKED"]).toContain(fixture.result.record.certificationState);
  });
});

import { describe, expect, it } from "vitest";
import { buildConstitutionalReadinessFixture } from "@/tests/integration/constitutional-readiness/helpers";

describe("constitutional readiness containment", () => {
  it("freezes on recursive coordination or authority expansion", () => {
    const fixture = buildConstitutionalReadinessFixture({
      metadata: Object.freeze({ recursiveCoordination: true, authorityExpansion: true }),
    });

    expect(["FROZEN", "INVALID"]).toContain(fixture.result.record.readinessClassification);
    expect(fixture.result.errors.some((item) => item.code.includes("RECURSIVE") || item.code.includes("ANTI_EMERGENCE"))).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { buildConstitutionalReadinessFixture } from "@/tests/integration/constitutional-readiness/helpers";

describe("constitutional readiness adversarial", () => {
  it("blocks synthetic authority and fabricated evidence", () => {
    const fixture = buildConstitutionalReadinessFixture({
      metadata: Object.freeze({ syntheticAuthority: true, fabricatedEvidence: true, confidenceSpoofing: true }),
    });

    expect(fixture.result.record.readinessClassification).toBe("INVALID");
    expect(fixture.result.errors.some((item) => item.code.includes("BOUNDARY"))).toBe(true);
  });
});

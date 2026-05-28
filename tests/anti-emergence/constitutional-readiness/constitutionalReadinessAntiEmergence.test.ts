import { describe, expect, it } from "vitest";
import { buildConstitutionalReadinessFixture } from "@/tests/integration/constitutional-readiness/helpers";

describe("constitutional readiness anti-emergence", () => {
  it("never treats confidence as authority", () => {
    const fixture = buildConstitutionalReadinessFixture({
      metadata: Object.freeze({ confidenceSpoofing: true }),
    });

    expect(fixture.result.authorityContract.readinessAuthorization).toBe(false);
    expect(fixture.result.record.readinessClassification).not.toBe("VERIFIED");
  });
});

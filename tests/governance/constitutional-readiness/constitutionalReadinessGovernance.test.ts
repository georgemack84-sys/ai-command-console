import { describe, expect, it } from "vitest";
import { buildConstitutionalReadinessFixture } from "@/tests/integration/constitutional-readiness/helpers";

describe("constitutional readiness governance", () => {
  it("freezes on governance suppression", () => {
    const fixture = buildConstitutionalReadinessFixture({
      metadata: Object.freeze({ governanceSuppression: true }),
    });

    expect(fixture.result.record.readinessClassification).toBe("FROZEN");
    expect(fixture.result.errors.some((item) => item.code.includes("GOVERNANCE"))).toBe(true);
  });
});

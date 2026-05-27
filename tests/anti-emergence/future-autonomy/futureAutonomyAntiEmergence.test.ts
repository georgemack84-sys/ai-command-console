import { describe, expect, it } from "vitest";
import { buildFutureAutonomyFixture } from "@/tests/integration/future-autonomy/helpers";

describe("future autonomy anti-emergence", () => {
  it("blocks approval inheritance and confidence-authority coupling", () => {
    const fixture = buildFutureAutonomyFixture({
      metadata: {
        approvalInheritance: true,
        confidenceAuthorityCoupling: true,
      },
    });

    expect(fixture.result.errors.map((item) => item.code)).toContain("FUTURE_AUTONOMY_APPROVAL_INHERITANCE");
    expect(fixture.result.errors.map((item) => item.code)).toContain("FUTURE_AUTONOMY_CONFIDENCE_AUTHORITY_COUPLING");
    expect(fixture.result.result.status).not.toBe("safe");
  });
});

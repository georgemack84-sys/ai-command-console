import { describe, expect, it } from "vitest";

import { buildCoordinationReadinessFixture } from "@/tests/integration/coordination-readiness-certification/helpers";

describe("coordination readiness governance", () => {
  it("fails closed on governance bypass attempts", () => {
    const fixture = buildCoordinationReadinessFixture({
      metadata: Object.freeze({ bypassGovernance: true }),
    });
    expect(fixture.result.record.certificationState).toBe("FAIL_CLOSED");
    expect(fixture.result.errors.map((error) => error.code)).toContain("COORDINATION_READINESS_GOVERNANCE_LINKAGE");
  });
});

import { describe, expect, it } from "vitest";

import { buildCoordinationBoundaryFixture } from "@/tests/integration/coordination-boundary-enforcement/helpers";

describe("boundary governance supremacy", () => {
  it("fails closed on governance bypass attempts", () => {
    const fixture = buildCoordinationBoundaryFixture({
      metadata: Object.freeze({ bypassGovernance: true }),
    });
    expect(fixture.result.record.failClosed).toBe(true);
    expect(fixture.result.record.verdict).toBe("INVALID_GOVERNANCE_LINKAGE");
  });
});

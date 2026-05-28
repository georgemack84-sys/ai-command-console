import { describe, expect, it } from "vitest";

import { buildHumanCoordinationOverrideFixture } from "@/tests/integration/human-coordination-override/helpers";

describe("human override governance", () => {
  it("fails closed on governance bypass attempts", () => {
    const fixture = buildHumanCoordinationOverrideFixture({
      metadata: Object.freeze({ bypassGovernance: true }),
    });
    expect(fixture.result.errors.map((error) => error.code)).toContain("HUMAN_COORDINATION_OVERRIDE_GOVERNANCE_MISMATCH");
    expect(fixture.result.record.failClosed).toBe(true);
  });
});

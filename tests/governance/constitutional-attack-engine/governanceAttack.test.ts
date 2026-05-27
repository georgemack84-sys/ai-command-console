import { describe, expect, it } from "vitest";

import { buildConstitutionalAttackFixture } from "@/tests/integration/constitutional-attack-engine/helpers";

describe("constitutional attack governance", () => {
  it("fails closed on governance bypass attempts", () => {
    const fixture = buildConstitutionalAttackFixture({
      metadata: Object.freeze({ bypassGovernance: true }),
    });
    expect(fixture.result.record.attackState).toBe("FAIL_CLOSED");
    expect(fixture.result.errors.map((error) => error.code)).toContain("ATTACK_GOVERNANCE_LINKAGE_MISSING");
  });
});

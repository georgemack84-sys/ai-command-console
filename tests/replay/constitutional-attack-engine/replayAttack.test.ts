import { describe, expect, it } from "vitest";

import { buildConstitutionalAttackFixture } from "@/tests/integration/constitutional-attack-engine/helpers";

describe("constitutional attack replay", () => {
  it("fails closed on replay repair markers", () => {
    const fixture = buildConstitutionalAttackFixture({
      metadata: Object.freeze({ repairReplay: true }),
    });
    expect(fixture.result.record.failClosed).toBe(true);
    expect(fixture.result.errors.map((error) => error.code)).toContain("ATTACK_REPLAY_REPAIR");
  });
});

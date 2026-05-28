import { describe, expect, it } from "vitest";

import { buildConstitutionalAttackFixture } from "@/tests/integration/constitutional-attack-engine/helpers";

describe("constitutional attack fail-closed behavior", () => {
  it("fails closed when deterministic seed is missing", () => {
    const fixture = buildConstitutionalAttackFixture({
      deterministicSeed: "",
    });
    expect(fixture.result.record.attackState).toBe("FAIL_CLOSED");
    expect(fixture.result.errors.map((error) => error.code)).toContain("ATTACK_SEED_MISSING");
  });
});

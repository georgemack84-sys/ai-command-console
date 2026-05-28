import { describe, expect, it } from "vitest";

import { buildConstitutionalAttackFixture } from "@/tests/integration/constitutional-attack-engine/helpers";

describe("constitutional attack engine", () => {
  it("reconstructs deterministic attack output", () => {
    const first = buildConstitutionalAttackFixture();
    const second = buildConstitutionalAttackFixture();
    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
    expect(first.result.vector.vectorHash).toBe(second.result.vector.vectorHash);
  });

  it("simulates healthy constitutional attacks without adding authority", () => {
    const fixture = buildConstitutionalAttackFixture();
    expect(fixture.result.record.attackState).toBe("SIMULATED");
    expect(fixture.result.authorityContract.executionAuthority).toBe(false);
    expect(fixture.result.authorityContract.orchestrationAuthority).toBe(false);
  });
});

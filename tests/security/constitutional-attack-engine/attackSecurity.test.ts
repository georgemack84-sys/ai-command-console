import { describe, expect, it } from "vitest";

import { buildConstitutionalAttackFixture } from "@/tests/integration/constitutional-attack-engine/helpers";

describe("constitutional attack security", () => {
  it("rejects authority inheritance and runtime mutation markers", () => {
    const fixture = buildConstitutionalAttackFixture({
      metadata: Object.freeze({ authorityInheritance: true, mutateRuntime: true }),
    });
    expect(fixture.result.record.failClosed).toBe(true);
    expect(fixture.result.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      "ATTACK_RUNTIME_MUTATION",
    ]));
    expect(fixture.result.weaknesses.map((item) => item.classification)).toContain("AUTHORITY_EXPANSION_RISK");
  });
});

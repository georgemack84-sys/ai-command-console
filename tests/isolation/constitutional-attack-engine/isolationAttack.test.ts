import { describe, expect, it } from "vitest";

import { buildConstitutionalAttackFixture } from "@/tests/integration/constitutional-attack-engine/helpers";

describe("constitutional attack isolation", () => {
  it("fails closed when operational imports are simulated", () => {
    const fixture = buildConstitutionalAttackFixture({
      metadata: Object.freeze({ orchestrationImport: true, schedulerImport: true }),
    });
    expect(fixture.result.record.failClosed).toBe(true);
    expect(fixture.result.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      "ATTACK_ORCHESTRATION_IMPORT",
      "ATTACK_SCHEDULER_IMPORT",
      "ATTACK_ISOLATION_VIOLATION",
    ]));
  });
});

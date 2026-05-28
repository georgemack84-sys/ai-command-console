import { describe, expect, it } from "vitest";

import { buildConstitutionalAttackFixture } from "@/tests/integration/constitutional-attack-engine/helpers";

describe("constitutional adversarial attack simulation", () => {
  it("rejects hidden execution and scheduling markers", () => {
    const fixture = buildConstitutionalAttackFixture({
      metadata: Object.freeze({ execute: true, schedule: true, executionImport: true }),
    });
    expect(fixture.result.record.failClosed).toBe(true);
    expect(fixture.result.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      "ATTACK_EXECUTION_IMPORT",
      "ATTACK_SCHEDULER_IMPORT",
      "ATTACK_ISOLATION_VIOLATION",
    ]));
  });

  it("rejects recursive orchestration and dynamic capability acquisition", () => {
    const fixture = buildConstitutionalAttackFixture({
      metadata: Object.freeze({ recursiveWorkflow: true, dynamicCapability: true, synthesizeTopology: true }),
    });
    expect(fixture.result.record.failClosed).toBe(true);
    expect(fixture.result.weaknesses.map((item) => item.classification)).toEqual(expect.arrayContaining([
      "AUTHORITY_EXPANSION_RISK",
      "ORCHESTRATION_DRIFT_RISK",
    ]));
  });
});

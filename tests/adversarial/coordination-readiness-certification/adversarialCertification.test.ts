import { describe, expect, it } from "vitest";

import { buildCoordinationReadinessFixture } from "@/tests/integration/coordination-readiness-certification/helpers";

describe("adversarial readiness certification", () => {
  it("rejects hidden execution and hidden scheduling emergence", () => {
    const fixture = buildCoordinationReadinessFixture({
      metadata: Object.freeze({ execute: true, schedule: true }),
    });
    expect(fixture.result.record.failClosed).toBe(true);
    expect(fixture.result.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      "COORDINATION_READINESS_HIDDEN_EXECUTION",
      "COORDINATION_READINESS_HIDDEN_SCHEDULING",
    ]));
  });

  it("rejects recursive orchestration and topology synthesis", () => {
    const fixture = buildCoordinationReadinessFixture({
      metadata: Object.freeze({ recursiveWorkflow: true, synthesizeTopology: true }),
    });
    expect(fixture.result.record.failClosed).toBe(true);
    expect(fixture.result.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      "COORDINATION_READINESS_RECURSIVE_ORCHESTRATION",
      "COORDINATION_READINESS_TOPOLOGY_SYNTHESIS",
    ]));
  });
});

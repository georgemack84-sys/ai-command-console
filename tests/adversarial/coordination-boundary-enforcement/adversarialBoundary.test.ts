import { describe, expect, it } from "vitest";

import { buildCoordinationBoundaryFixture } from "@/tests/integration/coordination-boundary-enforcement/helpers";

describe("adversarial boundary enforcement", () => {
  it("rejects recursive coordination loops and topology synthesis", () => {
    const fixture = buildCoordinationBoundaryFixture({
      metadata: Object.freeze({ recursiveWorkflow: true, synthesizeTopology: true }),
    });
    expect(fixture.result.record.failClosed).toBe(true);
    expect(fixture.result.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      "COORDINATION_BOUNDARY_RECURSIVE_ORCHESTRATION",
      "COORDINATION_BOUNDARY_TOPOLOGY_SYNTHESIS",
    ]));
  });

  it("rejects hidden continuation and routing restoration", () => {
    const fixture = buildCoordinationBoundaryFixture({
      metadata: Object.freeze({ continueWorkflow: true, restoreRouting: true }),
    });
    expect(fixture.result.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      "COORDINATION_BOUNDARY_EXECUTION_SEMANTICS",
      "COORDINATION_BOUNDARY_ROUTING_RESTORATION",
    ]));
  });
});

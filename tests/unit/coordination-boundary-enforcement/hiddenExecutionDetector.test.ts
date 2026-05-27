import { describe, expect, it } from "vitest";

import { buildCoordinationBoundaryFixture } from "@/tests/integration/coordination-boundary-enforcement/helpers";

describe("hidden execution detection", () => {
  it("fails closed on execution and retry markers", () => {
    const fixture = buildCoordinationBoundaryFixture({
      metadata: Object.freeze({ execute: true, retry: true }),
    });
    expect(fixture.result.record.verdict).toBe("INVALID_EXECUTION_SEMANTICS");
    expect(fixture.result.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      "COORDINATION_BOUNDARY_EXECUTION_SEMANTICS",
      "COORDINATION_BOUNDARY_HIDDEN_SCHEDULING",
    ]));
  });
});

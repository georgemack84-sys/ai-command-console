import { describe, expect, it } from "vitest";

import { buildCoordinationBoundaryFixture } from "@/tests/integration/coordination-boundary-enforcement/helpers";

describe("boundary security", () => {
  it("rejects authority inheritance and hidden scheduling emergence", () => {
    const fixture = buildCoordinationBoundaryFixture({
      metadata: Object.freeze({ authorityInheritance: true, schedule: true }),
    });
    expect(fixture.result.record.failClosed).toBe(true);
    expect(fixture.result.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      "COORDINATION_BOUNDARY_AUTHORITY_EXPANSION",
      "COORDINATION_BOUNDARY_HIDDEN_SCHEDULING",
    ]));
  });
});

import { describe, expect, it } from "vitest";

import { buildCoordinationReadinessFixture } from "@/tests/integration/coordination-readiness-certification/helpers";

describe("coordination readiness security", () => {
  it("rejects authority inheritance and runtime mutation markers", () => {
    const fixture = buildCoordinationReadinessFixture({
      metadata: Object.freeze({ authorityInheritance: true, mutateRuntime: true }),
    });
    expect(fixture.result.record.failClosed).toBe(true);
    expect(fixture.result.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      "COORDINATION_READINESS_AUTHORITY_EXPANSION",
      "COORDINATION_READINESS_RUNTIME_MUTATION",
    ]));
  });
});

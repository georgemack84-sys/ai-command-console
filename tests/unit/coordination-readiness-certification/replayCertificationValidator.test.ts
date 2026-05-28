import { describe, expect, it } from "vitest";

import { buildCoordinationReadinessFixture } from "@/tests/integration/coordination-readiness-certification/helpers";

describe("replay certification", () => {
  it("fails closed on replay repair markers", () => {
    const fixture = buildCoordinationReadinessFixture({
      metadata: Object.freeze({ repairReplay: true }),
    });
    expect(fixture.result.record.failClosed).toBe(true);
    expect(fixture.result.errors.map((error) => error.code)).toContain("COORDINATION_READINESS_REPLAY_REPAIR");
  });
});

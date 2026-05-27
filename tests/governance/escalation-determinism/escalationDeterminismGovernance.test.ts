import { describe, expect, it } from "vitest";
import { buildEscalationDeterminismFixture } from "@/tests/integration/escalation-determinism/helpers";

describe("escalation determinism governance", () => {
  it("fails closed on governance uncertainty", () => {
    const fixture = buildEscalationDeterminismFixture({
      metadata: Object.freeze({ governanceUncertainty: true }),
    });

    expect(["disputed", "frozen", "revoked"]).toContain(fixture.result.record.oversightState);
    expect(fixture.result.record.failClosed).toBe(true);
  });
});

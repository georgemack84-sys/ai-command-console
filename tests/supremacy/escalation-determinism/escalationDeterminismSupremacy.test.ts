import { describe, expect, it } from "vitest";
import { buildEscalationDeterminismFixture } from "@/tests/integration/escalation-determinism/helpers";

describe("escalation determinism supremacy", () => {
  it("does not allow escalation to survive revocation", () => {
    const fixture = buildEscalationDeterminismFixture({
      metadata: Object.freeze({ escalationSurvivesRevocation: true }),
    });

    expect(["elevated", "frozen", "disputed", "revoked"]).toContain(fixture.result.record.oversightState);
    expect(fixture.result.record.failClosed).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { buildEscalationDeterminismFixture } from "@/tests/integration/escalation-determinism/helpers";

describe("escalation determinism fail-closed", () => {
  it("freezes on containment degradation", () => {
    const fixture = buildEscalationDeterminismFixture({
      metadata: Object.freeze({ containmentDegradation: true }),
    });

    expect(["frozen", "disputed", "revoked"]).toContain(fixture.result.record.oversightState);
    expect(fixture.result.record.failClosed).toBe(true);
  });
});

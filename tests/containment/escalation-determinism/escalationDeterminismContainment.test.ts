import { describe, expect, it } from "vitest";
import { buildEscalationDeterminismFixture } from "@/tests/integration/escalation-determinism/helpers";

describe("escalation determinism containment", () => {
  it("freezes when uncertainty increases oversight", () => {
    const fixture = buildEscalationDeterminismFixture({
      metadata: Object.freeze({ authorityAmbiguity: true, containmentInstability: true }),
    });

    expect(["frozen", "disputed", "revoked"]).toContain(fixture.result.record.oversightState);
  });
});

import { describe, expect, it } from "vitest";
import { buildEscalationDeterminismFixture } from "@/tests/integration/escalation-determinism/helpers";

describe("escalation determinism anti-emergence", () => {
  it("revokes on recursive escalation semantics", () => {
    const fixture = buildEscalationDeterminismFixture({
      metadata: Object.freeze({ recursiveEscalation: true, escalationSchedulingSemantics: true }),
    });

    expect(fixture.result.record.oversightState).toBe("revoked");
  });
});

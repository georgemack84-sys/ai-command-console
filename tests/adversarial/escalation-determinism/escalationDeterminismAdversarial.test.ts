import { describe, expect, it } from "vitest";
import { buildEscalationDeterminismFixture } from "@/tests/integration/escalation-determinism/helpers";

describe("escalation determinism adversarial", () => {
  it("revokes on hidden escalation routing and execution markers", () => {
    const fixture = buildEscalationDeterminismFixture({
      metadata: Object.freeze({ hiddenEscalationRouting: true, escalationDrivenExecution: true }),
    });

    expect(fixture.result.record.oversightState).toBe("revoked");
  });
});

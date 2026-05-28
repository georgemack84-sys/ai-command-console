import { describe, expect, it } from "vitest";

import { buildEscalationAwareCoordinationFixture } from "@/tests/integration/escalation-aware-coordination/helpers";

describe("escalation-aware coordination", () => {
  it("reconstructs deterministic escalation-aware coordination", () => {
    const first = buildEscalationAwareCoordinationFixture();
    const second = buildEscalationAwareCoordinationFixture();
    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
    expect(first.result.record.lineageHash).toBe(second.result.record.lineageHash);
  });

  it("escalates on confidence degradation without increasing authority", () => {
    const fixture = buildEscalationAwareCoordinationFixture({
      metadata: Object.freeze({ confidenceDegradation: true }),
    });
    expect(fixture.result.record.escalationState === "degraded" || fixture.result.record.escalationState === "elevated").toBe(true);
    expect(fixture.result.authorityContract.executionAuthority).toBe(false);
  });
});

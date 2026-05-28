import { describe, expect, it } from "vitest";

import { buildEscalationAwareCoordinationFixture } from "@/tests/integration/escalation-aware-coordination/helpers";

describe("escalation-aware coordination replay", () => {
  it("keeps escalation replay deterministic and replay-safe", () => {
    const fixture = buildEscalationAwareCoordinationFixture();
    expect(fixture.result.deterministicHash.length).toBeGreaterThan(0);
    expect(fixture.result.record.replaySafe).toBe(true);
  });
});

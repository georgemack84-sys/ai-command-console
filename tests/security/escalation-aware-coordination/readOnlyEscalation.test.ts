import { describe, expect, it } from "vitest";

import { buildEscalationAwareCoordinationFixture } from "@/tests/integration/escalation-aware-coordination/helpers";

describe("escalation-aware coordination security posture", () => {
  it("remains oversight-only and non-executing", () => {
    const fixture = buildEscalationAwareCoordinationFixture();
    expect(fixture.result.warnings[0]).toContain("oversight-only");
    expect(fixture.result.derivedOnly).toBe(true);
    expect(fixture.result.authorityContract.workflowContinuation).toBe(false);
  });
});

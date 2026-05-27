import { describe, expect, it } from "vitest";

import { buildEscalationAwareCoordinationFixture } from "@/tests/integration/escalation-aware-coordination/helpers";

describe("governance escalation", () => {
  it("fails closed on governance substitution attempts", () => {
    const fixture = buildEscalationAwareCoordinationFixture({
      metadata: Object.freeze({ substituteGovernance: true }),
    });
    expect(fixture.result.errors.map((error) => error.code)).toContain("ESCALATION_COORDINATION_GOVERNANCE_MISMATCH");
  });

  it("freezes on approval lineage incompleteness", () => {
    const fixture = buildEscalationAwareCoordinationFixture({
      approvalStatus: "required",
      approvalValid: false,
    });
    expect(fixture.result.record.failClosed).toBe(true);
    expect(fixture.result.errors.map((error) => error.code)).toContain("ESCALATION_COORDINATION_APPROVAL_INCOMPLETE");
  });
});

import { describe, expect, it } from "vitest";
import { validateEscalationGovernance } from "@/services/escalation/escalationGovernanceValidator";

describe("escalation governance validator", () => {
  it("fails closed on governance mismatch", () => {
    const errors = validateEscalationGovernance({
      freshnessStatus: "stale",
      governanceCompatibility: "invalid",
      replayIntegrity: "verified",
      readinessCertified: true,
    });
    expect(errors.map((error) => error.code)).toContain("ESCALATION_GOVERNANCE_MISMATCH");
  });
});

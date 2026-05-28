import { describe, expect, it } from "vitest";

import { arbitrateGovernanceResults } from "@/services/governance/governanceArbitration";

describe("arbitrateGovernanceResults", () => {
  it("selects the most restrictive valid result", () => {
    const result = arbitrateGovernanceResults([
      {
        allowed: true,
        constitutionalState: "RESTRICTED",
        violations: [],
        requiredApprovals: ["operator_review"],
        escalationRequired: false,
        containmentRequired: false,
        governanceConfidence: 0.8,
        reasoning: ["restricted"],
      },
      {
        allowed: false,
        constitutionalState: "CONTAINED",
        violations: ["containment_verification_failed"],
        requiredApprovals: ["containment_review"],
        escalationRequired: true,
        containmentRequired: true,
        governanceConfidence: 0.3,
        reasoning: ["contained"],
      },
    ]);

    expect(result.constitutionalState).toBe("CONTAINED");
    expect(result.allowed).toBe(false);
  });
});

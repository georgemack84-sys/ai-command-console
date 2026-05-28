import { describe, expect, it } from "vitest";

import { evaluateConstitutionalGovernance } from "@/services/governance/constitutionalGovernanceEngine";

describe("evaluateConstitutionalGovernance", () => {
  it("fails closed on disputed truth and validation failure", () => {
    const result = evaluateConstitutionalGovernance({
      constitutionalAction: "DENY",
      constitutionalViolations: ["disputed_truth_blocks_recovery"],
      validation: {
        valid: false,
        freezeActivated: true,
        containmentActivated: true,
        blockedReasons: ["validation_freeze_required"],
      },
      readiness: {
        readinessState: "CONSTITUTIONALLY_BLOCKED",
        readinessScore: 12,
        requiresOperatorApproval: true,
      },
      operatorApprovalVerified: false,
    });

    expect(result.allowed).toBe(false);
    expect(result.constitutionalState).toBe("DENIED");
    expect(result.containmentRequired).toBe(true);
    expect(result.escalationRequired).toBe(true);
  });
});

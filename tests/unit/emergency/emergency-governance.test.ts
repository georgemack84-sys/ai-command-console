import { describe, expect, it } from "vitest";

import { evaluateConstitutionalGovernance } from "@/services/governance/constitutionalGovernanceEngine";

describe("emergency governance", () => {
  it("locks unsafe operations during emergency governance", () => {
    const result = evaluateConstitutionalGovernance({
      constitutionalAction: "ESCALATE",
      constitutionalViolations: ["governance_outage_detected"],
      validation: {
        valid: false,
        freezeActivated: true,
        containmentActivated: true,
        blockedReasons: ["governance_outage_detected", "validation_freeze_required"],
      },
      readiness: {
        readinessState: "NOT_READY",
        readinessScore: 9,
        requiresOperatorApproval: true,
      },
      operatorApprovalVerified: false,
    });

    expect(result.constitutionalState).toBe("EMERGENCY_GOVERNANCE");
    expect(result.allowed).toBe(false);
  });
});

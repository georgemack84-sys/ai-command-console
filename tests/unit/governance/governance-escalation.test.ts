import { describe, expect, it } from "vitest";

import { evaluateGovernanceEscalation } from "@/services/governance/governanceEscalation";

describe("evaluateGovernanceEscalation", () => {
  it("requires escalation for disputed truth and emergency governance", () => {
    const result = evaluateGovernanceEscalation({
      constitutionalState: "EMERGENCY_GOVERNANCE",
      violations: ["disputed_truth_detected"],
      governanceConfidence: 0.2,
    });

    expect(result.escalationRequired).toBe(true);
    expect(result.reasoning).toContain("emergency_governance_requires_escalation");
  });
});

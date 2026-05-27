import { describe, expect, it } from "vitest";

import { evaluateAdaptiveGovernance } from "@/services/governance/adaptiveGovernanceEngine";

describe("adaptive governance runtime blocking", () => {
  it("keeps advisory governance from becoming runtime mutation", () => {
    const result = evaluateAdaptiveGovernance({
      source: "system",
      observedIssue: "Need governance improvement",
      evidence: ["audit:a", "sovereignty:b", "coordination:c"],
      affectedSystems: ["governance"],
      currentRiskLevel: "HIGH",
      constitutionalContext: {
        immutableTruthAffected: false,
        approvalRequired: true,
        escalationRequired: false,
        disputedStatePresent: false,
      },
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(result.advisoryOnly).toBe(true);
    expect(result.requiresApproval).toBe(true);
  });
});

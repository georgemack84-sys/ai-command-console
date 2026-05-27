import { describe, expect, it } from "vitest";

import { buildContainmentEscalation } from "@/services/containment/containmentEscalation";

describe("containment escalation", () => {
  it("escalates emergency stabilization requirements", () => {
    const result = buildContainmentEscalation({
      recommendedAction: "QUARANTINE",
      emergencyStabilizationRequired: true,
      operatorInterventionRequired: true,
      unstableDomains: ["runtime"],
    });

    expect(result.escalationRequired).toBe(true);
    expect(result.escalationReasoning).toContain("emergency_stabilization_required");
  });
});

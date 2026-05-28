import { describe, expect, it } from "vitest";

import { buildCollapsePreventionPlan } from "@/services/resilience/collapsePrevention";

describe("buildCollapsePreventionPlan", () => {
  it("prefers freeze/containment recommendations when collapse pressure is high", () => {
    const result = buildCollapsePreventionPlan({
      survivabilityState: "SURVIVABILITY_CRITICAL",
      collapseRisk: 0.86,
      governanceSafe: false,
      isolatedDomains: ["replay"],
      escalationPressure: 0.77,
      containmentRequired: true,
      createdAt: 10,
    });

    expect(result.containmentActions).toContain("FREEZE");
    expect(result.containmentActions).toContain("CONTAIN");
    expect(result.advisoryOnly).toBe(true);
  });
});

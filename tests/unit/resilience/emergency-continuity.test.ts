import { describe, expect, it } from "vitest";

import { buildEmergencyContinuityPlan } from "@/services/resilience/emergencyContinuity";

describe("buildEmergencyContinuityPlan", () => {
  it("remains advisory-only and never allows execution bypass", () => {
    const result = buildEmergencyContinuityPlan({
      resilienceState: "CONSTITUTIONAL_EMERGENCY",
      containmentState: "CONTAINMENT_ACTIVE",
      blockedReasons: ["replay_mismatch"],
      isolatedDomains: ["replay", "coordination"],
      operatorInterventionRequired: true,
      createdAt: 10,
    });

    expect(result.advisoryOnly).toBe(true);
    expect(result.executionAuthorized).toBe(false);
    expect(result.recommendedActions).toContain("freeze_unsafe_progression");
  });
});

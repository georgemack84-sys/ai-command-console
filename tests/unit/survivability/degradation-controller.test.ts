import { describe, expect, it } from "vitest";

import { determineDegradationMode } from "@/services/survivability/degradationController";

describe("degradation controller", () => {
  it("downgrades autonomy without self-upgrade", () => {
    const result = determineDegradationMode({
      survivabilityState: "CRITICAL",
      systemicInstability: 0.82,
      governancePriorityRequired: true,
      containmentPriorityRequired: true,
      auditPriorityRequired: true,
      currentAutonomyLevel: "FULL_AUTONOMY",
    });

    expect(result.degradationMode).toBe("EMERGENCY_STABILIZATION");
    expect(result.autonomyLevel).toBe("ADVISORY_ONLY");
  });
});

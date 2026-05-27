import { describe, expect, it } from "vitest";

import { determineDegradationMode } from "@/services/survivability/degradationController";

describe("autonomy downgrade", () => {
  it("downgrades from full autonomy to frozen along the declared path", () => {
    const result = determineDegradationMode({
      survivabilityState: "FROZEN",
      systemicInstability: 0.95,
      governancePriorityRequired: true,
      containmentPriorityRequired: true,
      auditPriorityRequired: true,
      currentAutonomyLevel: "FULL_AUTONOMY",
    });

    expect(result.autonomyLevel).toBe("FROZEN");
  });
});

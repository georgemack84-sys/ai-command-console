import { describe, expect, it } from "vitest";

import { adaptReadinessToSovereignty } from "@/services/sovereignty/readinessSovereigntyAdapter";

describe("adaptReadinessToSovereignty", () => {
  it("inherits readiness restrictions without promoting authority", () => {
    const result = adaptReadinessToSovereignty({
      readinessState: "GOVERNANCE_BLOCKED",
      readinessConfidence: 0.42,
      blockingRisks: ["READINESS_BLOCKED_BY_DISPUTED_TRUTH"],
      advisoryOnly: true,
      autonomyPromotionAllowed: false,
    });

    expect(result.constitutionalSafe).toBe(false);
    expect(result.inheritedConstraints).toContain("READINESS_BLOCKED_BY_DISPUTED_TRUTH");
  });
});

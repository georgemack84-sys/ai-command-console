import { describe, expect, it } from "vitest";

import { runConstitutionalChaosValidation } from "@/services/validation/constitutionalChaosEngine";

describe("runConstitutionalChaosValidation", () => {
  it("fails closed under hostile deterministic chaos conditions", () => {
    const result = runConstitutionalChaosValidation({
      conditions: ["lease_loss", "replay_corruption", "governance_outage", "operator_interruption"],
    });

    expect(result.freezeActivated).toBe(true);
    expect(result.containmentActivated).toBe(true);
    expect(result.operatorReviewRequired).toBe(true);
    expect(result.blockedReasons).toContain("lease_loss_detected");
    expect(result.blockedReasons).toContain("replay_corruption_detected");
    expect(result.blockedReasons).toContain("governance_outage_detected");
  });
});

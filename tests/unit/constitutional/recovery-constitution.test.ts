import { describe, expect, it } from "vitest";

import { evaluateRecoveryConstitution } from "@/services/constitutional/recoveryConstitution";

describe("evaluateRecoveryConstitution", () => {
  it("freezes on disputed truth and immutable evidence risk", () => {
    const result = evaluateRecoveryConstitution({
      executionId: "exec_1",
      governanceDisputes: ["truth_disputed"],
      immutableEvidenceValid: false,
      replayVerificationState: "DIVERGED",
      operatorFreeze: true,
      forecast: {
        summary: {
          advisoryOnly: true,
          collapseRisk: 0.85,
          containmentPressure: 0.7,
          governanceInstabilityRisk: 0.8,
        },
      },
    } as never);

    expect(result.violations).toContain("disputed_truth_blocks_recovery");
    expect(result.requiredAction).toBe("DENY");
  });
});

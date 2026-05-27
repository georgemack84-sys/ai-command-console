import { describe, expect, it } from "vitest";

import { evaluateStewardshipLifecycle } from "@/services/stewardship/stewardshipLifecycle";

describe("evaluateStewardshipLifecycle", () => {
  it("moves disputed truth into DISPUTED", () => {
    const result = evaluateStewardshipLifecycle({
      verificationStatus: "DISPUTED",
      reconciliationState: "DISPUTED",
      certificationDecision: "REQUIRES_OPERATOR_REVIEW",
      continuityState: "DEGRADED",
      shouldFreeze: false,
      shouldContain: false,
      shouldEscalate: false,
      governanceBlocked: false,
      verificationBlocked: false,
      conflictingRecoveries: false,
      stabilizationStatus: "degrading",
      survivabilityScore: 0.4,
    });

    expect(result.state).toBe("DISPUTED");
  });

  it("does not move rejected certification into VERIFIED", () => {
    const result = evaluateStewardshipLifecycle({
      verificationStatus: "VERIFIED",
      reconciliationState: "RECONCILED",
      certificationDecision: "REJECTED",
      continuityState: "HEALTHY",
      shouldFreeze: false,
      shouldContain: false,
      shouldEscalate: true,
      governanceBlocked: true,
      verificationBlocked: false,
      conflictingRecoveries: false,
      stabilizationStatus: "stable",
      survivabilityScore: 0.95,
    });

    expect(result.state).toBe("ESCALATED");
  });
});

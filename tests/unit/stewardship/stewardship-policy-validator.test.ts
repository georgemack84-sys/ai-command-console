import { describe, expect, it } from "vitest";

import { validateStewardshipPolicy } from "@/services/stewardship/stewardshipPolicyValidator";

describe("validateStewardshipPolicy", () => {
  it("fails closed when verification truth is missing", () => {
    const result = validateStewardshipPolicy({});

    expect(result.ok).toBe(false);
    expect(result.verificationBlocked).toBe(true);
    expect(result.reasons).toContain("RECOVERY_VERIFICATION_EVIDENCE_MISSING");
  });

  it("blocks conflicting recoveries", () => {
    const result = validateStewardshipPolicy({
      verification: {
        verificationId: "verification_1",
        executionId: "execution_1",
        status: "VERIFIED",
        reconciliationState: "RECONCILED",
        certificationDecision: "CERTIFIED",
        verified: true,
        disputed: false,
        divergenceDetected: false,
        requiresOperatorReview: false,
        evidence: ["event_1"],
        errors: [],
        warnings: [],
        timestamp: "2026-05-09T00:00:00.000Z",
      },
      conflictingRecoveries: true,
    });

    expect(result.ok).toBe(false);
    expect(result.governanceBlocked).toBe(true);
    expect(result.reasons).toContain("RECOVERY_CONFLICTING_RECOVERIES");
  });
});

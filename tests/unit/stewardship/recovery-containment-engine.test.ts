import { describe, expect, it } from "vitest";

import { evaluateRecoveryContainment } from "@/services/stewardship/recoveryContainmentEngine";

describe("evaluateRecoveryContainment", () => {
  it("freezes unsafe recovery chains", () => {
    const result = evaluateRecoveryContainment({
      verification: {
        verificationId: "verification_1",
        executionId: "execution_1",
        status: "DISPUTED",
        reconciliationState: "DISPUTED",
        certificationDecision: "REQUIRES_OPERATOR_REVIEW",
        verified: false,
        disputed: true,
        divergenceDetected: false,
        requiresOperatorReview: true,
        evidence: ["event_1"],
        errors: [],
        warnings: [],
        timestamp: "2026-05-09T00:00:00.000Z",
      },
      stabilization: {
        status: "degrading",
        confidence: 0.42,
        degradationIndicators: [],
        reasoning: [],
      },
      conflictingRecoveries: true,
      survivabilityScore: 0.6,
    });

    expect(result.shouldFreeze).toBe(true);
  });

  it("contains replay divergence", () => {
    const result = evaluateRecoveryContainment({
      verification: {
        verificationId: "verification_1",
        executionId: "execution_1",
        status: "DIVERGED",
        reconciliationState: "DIVERGED",
        certificationDecision: "QUARANTINED",
        verified: false,
        disputed: false,
        divergenceDetected: true,
        requiresOperatorReview: false,
        evidence: ["event_1"],
        errors: [],
        warnings: [],
        timestamp: "2026-05-09T00:00:00.000Z",
      },
      stabilization: {
        status: "unstable",
        confidence: 0.2,
        degradationIndicators: [],
        reasoning: [],
      },
      survivabilityScore: 0.2,
    });

    expect(result.shouldContain).toBe(true);
  });
});

import { describe, expect, it } from "vitest";

import { mapFailureClassificationToRecovery } from "../../services/failure/failureRecoveryMapping";

describe("failure recovery mapping", () => {
  it("maps low severity to limited safe recovery", () => {
    const result = mapFailureClassificationToRecovery({
      category: "timeout",
      severity: "LOW",
      recoverable: true,
      requiresApproval: false,
      requiresEscalation: false,
      confidence: 0.8,
      evidence: ["timeout:step_duration_exceeded"],
    });

    expect(result.retryAllowed).toBe(true);
    expect(result.blocked).toBe(false);
  });

  it("maps moderate severity to controlled recovery", () => {
    const result = mapFailureClassificationToRecovery({
      category: "heartbeat loss",
      severity: "MODERATE",
      recoverable: true,
      requiresApproval: false,
      requiresEscalation: false,
      confidence: 0.8,
      evidence: ["heartbeat:missing"],
    });

    expect(result.retryAllowed).toBe(true);
    expect(result.operatorInterventionRequired).toBe(false);
  });

  it("requires stronger governance for high severity", () => {
    const result = mapFailureClassificationToRecovery({
      category: "approval expiration",
      severity: "HIGH",
      recoverable: true,
      requiresApproval: true,
      requiresEscalation: false,
      confidence: 0.82,
      evidence: ["approval:expired"],
    });

    expect(result.approvalRequired).toBe(true);
  });

  it("requires escalation for critical severity", () => {
    const result = mapFailureClassificationToRecovery({
      category: "verification mismatch",
      severity: "CRITICAL",
      recoverable: false,
      requiresApproval: true,
      requiresEscalation: true,
      confidence: 0.9,
      evidence: ["verification:failed"],
    });

    expect(result.escalationRequired).toBe(true);
    expect(result.blocked).toBe(true);
  });

  it("blocks automatic recovery for catastrophic severity", () => {
    const result = mapFailureClassificationToRecovery({
      category: "evidence inconsistency",
      severity: "CATASTROPHIC",
      recoverable: false,
      requiresApproval: true,
      requiresEscalation: true,
      confidence: 0.95,
      evidence: ["timeline:disputed", "evidence:immutable_conflict"],
    });

    expect(result.blocked).toBe(true);
    expect(result.quarantineRequired).toBe(true);
  });

  it("does not map governance denial to normal retry", () => {
    const result = mapFailureClassificationToRecovery({
      category: "governance denial",
      severity: "HIGH",
      recoverable: false,
      requiresApproval: false,
      requiresEscalation: true,
      confidence: 0.92,
      evidence: ["policy:denied"],
    });

    expect(result.retryAllowed).toBe(false);
    expect(result.reason).toBe("FAILURE_RECOVERY_GOVERNANCE_DENIAL_NOT_RETRYABLE");
  });

  it("maps evidence inconsistency to disputed handling", () => {
    const result = mapFailureClassificationToRecovery({
      category: "evidence inconsistency",
      severity: "CRITICAL",
      recoverable: false,
      requiresApproval: true,
      requiresEscalation: true,
      confidence: 0.45,
      evidence: ["timeline:disputed"],
    });

    expect(result.disputed).toBe(true);
    expect(result.replayAllowed).toBe(false);
  });

  it("blocks replay for replay divergence", () => {
    const result = mapFailureClassificationToRecovery({
      category: "replay divergence",
      severity: "CRITICAL",
      recoverable: false,
      requiresApproval: true,
      requiresEscalation: true,
      confidence: 0.85,
      evidence: ["replay:divergent"],
    });

    expect(result.replayAllowed).toBe(false);
    expect(result.reason).toBe("FAILURE_RECOVERY_REPLAY_DIVERGENCE_BLOCKED");
  });

  it("requires approval renewal for approval expiration", () => {
    const result = mapFailureClassificationToRecovery({
      category: "approval expiration",
      severity: "HIGH",
      recoverable: true,
      requiresApproval: true,
      requiresEscalation: false,
      confidence: 0.84,
      evidence: ["approval:expired"],
    });

    expect(result.approvalRequired).toBe(true);
    expect(result.retryAllowed).toBe(false);
  });

  it("blocks mutation recovery when the database is unavailable", () => {
    const result = mapFailureClassificationToRecovery({
      category: "database unavailable",
      severity: "HIGH",
      recoverable: false,
      requiresApproval: true,
      requiresEscalation: true,
      confidence: 0.91,
      evidence: ["database:unavailable"],
    });

    expect(result.retryAllowed).toBe(false);
    expect(result.rollbackRequired).toBe(false);
    expect(result.operatorInterventionRequired).toBe(true);
  });
});

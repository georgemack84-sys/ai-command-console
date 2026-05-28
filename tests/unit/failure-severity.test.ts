import { describe, expect, it } from "vitest";

import {
  FAILURE_SEVERITY,
  compareFailureSeverity,
  deriveFailureSeverity,
  isAutomaticRecoveryBlockedForSeverity,
} from "../../services/failure/failureSeverity";

describe("failure severity", () => {
  it("orders severities deterministically", () => {
    expect(compareFailureSeverity(FAILURE_SEVERITY.LOW, FAILURE_SEVERITY.MODERATE)).toBeLessThan(0);
    expect(compareFailureSeverity(FAILURE_SEVERITY.MODERATE, FAILURE_SEVERITY.HIGH)).toBeLessThan(0);
    expect(compareFailureSeverity(FAILURE_SEVERITY.HIGH, FAILURE_SEVERITY.CRITICAL)).toBeLessThan(0);
    expect(compareFailureSeverity(FAILURE_SEVERITY.CRITICAL, FAILURE_SEVERITY.CATASTROPHIC)).toBeLessThan(0);
  });

  it("blocks automatic recovery for catastrophic severity", () => {
    expect(isAutomaticRecoveryBlockedForSeverity(FAILURE_SEVERITY.CATASTROPHIC)).toBe(true);
    expect(isAutomaticRecoveryBlockedForSeverity(FAILURE_SEVERITY.CRITICAL)).toBe(false);
  });

  it("does not silently downgrade severity", () => {
    const severity = deriveFailureSeverity({
      defaultSeverity: FAILURE_SEVERITY.HIGH,
      evidence: ["signal:governance_denial", "approval:missing"],
      contradictory: false,
      severityHint: FAILURE_SEVERITY.MODERATE,
    });

    expect(severity).toBe(FAILURE_SEVERITY.HIGH);
  });

  it("escalates contradictory evidence to critical or above", () => {
    const severity = deriveFailureSeverity({
      defaultSeverity: FAILURE_SEVERITY.MODERATE,
      evidence: ["verification:passed", "verification:failed"],
      contradictory: true,
    });

    expect(compareFailureSeverity(severity, FAILURE_SEVERITY.CRITICAL)).toBeGreaterThanOrEqual(0);
  });
});

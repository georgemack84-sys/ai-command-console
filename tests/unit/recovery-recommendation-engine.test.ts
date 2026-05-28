import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { recommendRecoveryAction } = require("../../services/recoveryRecommendationEngine.js");

describe("recovery recommendation engine", () => {
  it("recommends safe retry for safe failed executions", () => {
    const result = recommendRecoveryAction({
      candidate: { signalType: "FAILED_EXECUTION" },
      signal: {
        signalType: "FAILED_EXECUTION",
        confidence: 0.82,
        evidence: { safeRetry: true },
        reason: "failed_execution_safe_retry",
      },
      modes: {},
    });

    expect(result).toEqual({
      ok: true,
      data: {
        recommendation: "retry_safe_steps",
        confidence: 0.82,
        requiresOperator: false,
        reason: "failed_execution_safe_retry",
      },
    });
  });

  it("returns none for unknown signals", () => {
    const result = recommendRecoveryAction({
      candidate: { signalType: "UNKNOWN" },
      signal: {
        signalType: "UNKNOWN",
        confidence: 0.4,
        evidence: {},
        reason: "unknown_recovery_signal",
      },
      modes: {},
    });

    expect(result).toEqual({
      ok: true,
      data: {
        recommendation: "none",
        confidence: 0.4,
        requiresOperator: true,
        reason: "unknown_recovery_signal",
      },
    });
  });

  it("clamps recommendation confidence", () => {
    const result = recommendRecoveryAction({
      candidate: { signalType: "EXPIRED_LEASE" },
      signal: {
        signalType: "EXPIRED_LEASE",
        confidence: 9,
        evidence: { safeContinuation: true },
        reason: "execution_lease_expired",
      },
      modes: {},
    });

    expect(result.ok).toBe(true);
    expect(result.data.confidence).toBeLessThanOrEqual(1);
    expect(result.data.confidence).toBeGreaterThanOrEqual(0);
  });
});

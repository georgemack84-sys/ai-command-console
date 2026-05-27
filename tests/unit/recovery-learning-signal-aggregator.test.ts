import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { aggregateRecoveryLearningSignals } = require("../../services/recoveryLearningSignalAggregator.js");

describe("recovery learning signal aggregator", () => {
  it("aggregates VERIFIED, FAILED, and UNKNOWN outcomes deterministically", () => {
    const result = aggregateRecoveryLearningSignals({
      verificationEvents: [
        { payload: { verification: { outcome: "VERIFIED" }, recoveryMode: "resume" } },
        { payload: { verification: { outcome: "FAILED" }, recoveryMode: "retry_safe_steps" } },
        { payload: { verification: { outcome: "UNKNOWN" }, recoveryMode: "resume" } },
      ],
      executionEvents: [],
      advisoryEvents: [
        { payload: { candidate: { signalType: "FAILED_EXECUTION" }, signal: { signalType: "FAILED_EXECUTION" }, recommendation: { recommendation: "retry_safe_steps" } } },
        { payload: { signal: { signalType: "EXPIRED_LEASE" } } },
      ],
      automationEvents: [],
      autonomyEvents: [],
    });

    expect(result).toEqual({
      ok: true,
      data: {
        totals: {
          verified: 1,
          failed: 1,
          unknown: 1,
          partial: 0,
          noMutationConfirmed: 0,
        },
        byRecoveryMode: expect.objectContaining({
          resume: expect.objectContaining({ total: 2 }),
          retry_safe_steps: expect.objectContaining({ total: 1 }),
        }),
        bySignalType: expect.objectContaining({
          FAILED_EXECUTION: 1,
          EXPIRED_LEASE: 1,
        }),
        byClassification: expect.any(Object),
        warnings: expect.any(Array),
      },
    });
  });

  it("adds warnings for missing evidence and fails closed on malformed input", () => {
    const result = aggregateRecoveryLearningSignals({
      verificationEvents: [],
      executionEvents: [],
      advisoryEvents: [],
      automationEvents: [],
      autonomyEvents: [],
    });
    expect(result.ok).toBe(true);
    expect(result.data.warnings.length).toBeGreaterThan(0);

    expect(
      aggregateRecoveryLearningSignals({
        verificationEvents: null,
        executionEvents: [],
        advisoryEvents: [],
        automationEvents: [],
        autonomyEvents: [],
      }),
    ).toEqual(
      expect.objectContaining({
        ok: false,
        error: "BLOCKED_UNSAFE_RECOVERY_LEARNING",
      }),
    );
  });
});

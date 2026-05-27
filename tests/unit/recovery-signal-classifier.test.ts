import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { classifyRecoverySignal } = require("../../services/recoverySignalClassifier.js");

describe("recovery signal classifier", () => {
  it("maps persisted evidence to a deterministic recovery signal", () => {
    const result = classifyRecoverySignal({
      candidate: {
        signalType: "EXPIRED_LEASE",
        evidence: {
          executionStatus: "running",
          leaseExpired: true,
        },
      },
      executionState: { execution: { status: "running" } },
      lockState: { executionId: "exec_1" },
      ledgerEvents: [],
    });

    expect(result).toEqual({
      ok: true,
      data: expect.objectContaining({
        signalType: "EXPIRED_LEASE",
        severity: "HIGH",
        confidence: expect.any(Number),
        reason: "execution_lease_expired",
      }),
    });
  });

  it("returns UNKNOWN for ambiguous evidence", () => {
    const result = classifyRecoverySignal({
      candidate: {
        signalType: "MYSTERY",
        evidence: {},
      },
      executionState: null,
      lockState: null,
      ledgerEvents: [],
    });

    expect(result).toEqual({
      ok: true,
      data: {
        signalType: "UNKNOWN",
        severity: "UNKNOWN",
        confidence: 0,
        evidence: {},
        reason: "unknown_recovery_signal",
      },
    });
  });

  it("clamps confidence between 0 and 1", () => {
    const result = classifyRecoverySignal({
      candidate: {
        signalType: "STALE_LOCK",
        evidence: {
          confidenceHint: 4,
        },
      },
      executionState: null,
      lockState: null,
      ledgerEvents: [],
    });

    expect(result.ok).toBe(true);
    expect(result.data.confidence).toBeLessThanOrEqual(1);
    expect(result.data.confidence).toBeGreaterThanOrEqual(0);
  });
});

import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createRecoveryPlanHash } = require("../../services/recoveryPlanHash.js");
const { explainRecoveryPlan } = require("../../services/recoveryExplainer.js");

function makePlan(overrides: Record<string, unknown> = {}) {
  return {
    executionId: "exec_support",
    planId: "plan_support",
    recoveryMode: "resume",
    checkpoint: {
      planId: "plan_support",
      status: "running",
      currentStep: 1,
      lastCompletedStepIndex: 0,
      cancellationRequested: false,
    },
    nextStep: {
      id: "step_1",
      sequence: 2,
    },
    source: {
      lastLedgerEventId: 7,
      activeLock: {
        workerId: "worker_1",
        leaseExpiresAt: 12345,
      },
      preflight: {
        eligible: true,
        message: null,
      },
      snapshot: {
        execution: {
          id: "exec_support",
          planId: "plan_support",
          status: "running",
          totalAttempts: 2,
          consecutiveFailures: 0,
          noProgressAttempts: 1,
          lastProgressAt: "2026-05-02T00:00:00.000Z",
        },
        steps: [
          {
            id: "step_0",
            status: "completed",
            attemptNumber: 1,
            attempts: 1,
            errorType: null,
            reason: null,
            lastOutputHash: "hash-a",
          },
          {
            id: "step_1",
            status: "pending",
            attemptNumber: 0,
            attempts: 0,
            errorType: null,
            reason: null,
            lastOutputHash: null,
          },
        ],
      },
    },
    ...overrides,
  };
}

describe("recovery support helpers", () => {
  it("creates a deterministic recovery plan hash from existing runtime state", () => {
    const first = createRecoveryPlanHash(makePlan());
    const second = createRecoveryPlanHash(makePlan());

    expect(first).toEqual(
      expect.objectContaining({
        ok: true,
        data: expect.objectContaining({
          executionStatus: "running",
          lockOwner: "worker_1",
          leaseExpiresAt: 12345,
          lastLedgerEventId: 7,
          checkpointHash: expect.any(String),
          stepStateHash: expect.any(String),
          containmentHash: expect.any(String),
        }),
      }),
    );
    expect(second).toEqual(first);
  });

  it("changes the stale token when checkpoint state changes", () => {
    const first = createRecoveryPlanHash(makePlan());
    const second = createRecoveryPlanHash(
      makePlan({
        checkpoint: {
          planId: "plan_support",
          status: "running",
          currentStep: 2,
          lastCompletedStepIndex: 1,
          cancellationRequested: false,
        },
      }),
    );

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(second.data.checkpointHash).not.toBe(first.data.checkpointHash);
  });

  it("builds a compact recovery explanation from the plan", () => {
    const explained = explainRecoveryPlan(makePlan());

    expect(explained).toEqual(
      expect.objectContaining({
        ok: true,
        data: expect.objectContaining({
          summary: expect.stringContaining("exec_support"),
          checkpointStatus: "running",
          nextStepId: "step_1",
          nextStepSequence: 2,
          eligible: true,
        }),
      }),
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";

const mockedApproveRecovery = vi.fn();

const events: Array<Record<string, unknown>> = [];

const require = createRequire(import.meta.url);
const controllerPath = require.resolve("../../services/recoveryAutonomyController.js");
const recoveryControllerPath = require.resolve("../../services/recoveryController.js");
const auditTrailPath = require.resolve("../../services/auditTrail.js");
const autonomyStorePath = require.resolve("../../services/recoveryAutonomyStore.js");
const recoveryAuditStorePath = require.resolve("../../services/recoveryAuditStore.js");
const committerPath = require.resolve("../../services/recoveryCommitter.js");

function seedPendingRequest(recoveryAuditStore: any, overrides: Record<string, unknown> = {}) {
  recoveryAuditStore.recordRecoveryRequest({
    recoveryRequestId: "recovery_1",
    executionId: "exec_1",
    recoveryMode: "resume",
    requestedBy: "operator_1",
    plan: { executionId: "exec_1", planId: "plan_1" },
    planHash: { token: "hash_1" },
  });
  recoveryAuditStore.recordPreview({
    recoveryRequestId: "recovery_1",
    executionId: "exec_1",
    requestedBy: "operator_1",
    preview: {
      staleToken: { token: "stale_1" },
      blocked: false,
      replayCandidates: [{ classification: "SAFE_REPLAY" }],
      ...(overrides.preview || {}),
    },
  });
  recoveryAuditStore.recordPolicyDecision({
    recoveryRequestId: "recovery_1",
    executionId: "exec_1",
    requestedBy: "operator_1",
    policy: {
      allowed: true,
      requiresApproval: true,
      reason: "safe_replay",
      policyCode: "SAFE_REPLAY",
      ...(overrides.policy || {}),
    },
  });
}

function loadController() {
  delete require.cache[controllerPath];
  delete require.cache[autonomyStorePath];
  delete require.cache[recoveryAuditStorePath];
  require.cache[recoveryControllerPath] = {
    id: recoveryControllerPath,
    filename: recoveryControllerPath,
    loaded: true,
    exports: {
      approveRecovery: mockedApproveRecovery,
    },
  } as any;
  require.cache[committerPath] = {
    id: committerPath,
    filename: committerPath,
    loaded: true,
    exports: {
      commitRecoveryPlan: () => {
        throw new Error("D-10 must not call D-6 commit directly");
      },
    },
  } as any;
  require.cache[auditTrailPath] = {
    id: auditTrailPath,
    filename: auditTrailPath,
    loaded: true,
    exports: {
      appendAuditEvent: (event: Record<string, unknown>) => {
        const entry = {
          id: `audit_${events.length + 1}`,
          timestamp: new Date(1700000000000 + events.length).toISOString(),
          ...event,
        };
        events.push(entry);
        return entry;
      },
      listAuditEvents: () => [...events].reverse(),
      clearAuditEvents: () => {
        events.splice(0, events.length);
      },
    },
  } as any;
  return require("../../services/recoveryAutonomyController.js");
}

beforeEach(() => {
  events.splice(0, events.length);
  mockedApproveRecovery.mockReset();
});

describe("recovery autonomy controller", () => {
  it("does not auto-approve during dry run", async () => {
    const controller = loadController();
    const recoveryAuditStore = require("../../services/recoveryAuditStore.js");
    const autonomyStore = require("../../services/recoveryAutonomyStore.js");
    seedPendingRequest(recoveryAuditStore);
    autonomyStore.recordAutonomyLevelChanged({
      level: "SUPERVISED_APPROVAL",
      changedBy: "operator_1",
      reason: "enable",
    });

    const result = await controller.evaluatePendingRecoveryAutonomy({
      requestedBy: "operator_1",
      limit: 5,
      dryRun: true,
    });

    expect(result.ok).toBe(true);
    expect(mockedApproveRecovery).not.toHaveBeenCalled();
  });

  it("routes auto-approval through D-7 only for low-risk requests", async () => {
    const controller = loadController();
    const recoveryAuditStore = require("../../services/recoveryAuditStore.js");
    const autonomyStore = require("../../services/recoveryAutonomyStore.js");
    seedPendingRequest(recoveryAuditStore);
    autonomyStore.recordAutonomyLevelChanged({
      level: "SUPERVISED_APPROVAL",
      changedBy: "operator_1",
      reason: "enable",
    });
    mockedApproveRecovery.mockResolvedValue({
      ok: true,
      data: { status: "APPROVED", recoveryRequestId: "recovery_1" },
    });

    const result = await controller.evaluatePendingRecoveryAutonomy({
      requestedBy: "operator_1",
      limit: 5,
      dryRun: false,
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        data: expect.objectContaining({
          evaluated: 1,
          autoApproved: 1,
        }),
      }),
    );
    expect(mockedApproveRecovery).toHaveBeenCalledWith({
      recoveryRequestId: "recovery_1",
      approvedBy: "operator_1",
    });
  });

  it("pause blocks autonomy evaluation", async () => {
    const controller = loadController();
    const autonomyStore = require("../../services/recoveryAutonomyStore.js");
    autonomyStore.recordAutonomyPaused({
      scope: "global",
      executionId: null,
      pausedBy: "operator_1",
      reason: "maintenance",
    });

    const result = await controller.evaluatePendingRecoveryAutonomy({
      requestedBy: "operator_1",
      limit: 5,
      dryRun: false,
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: "BLOCKED_UNSAFE_RECOVERY_AUTONOMY",
      }),
    );
    expect(mockedApproveRecovery).not.toHaveBeenCalled();
  });
});

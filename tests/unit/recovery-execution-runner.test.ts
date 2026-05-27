import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";

const mockedCommitRecovery = vi.fn();

const events: Array<Record<string, unknown>> = [];

const require = createRequire(import.meta.url);
const runnerPath = require.resolve("../../services/recoveryExecutionRunner.js");
const recoveryControllerPath = require.resolve("../../services/recoveryController.js");
const recoveryAuditStorePath = require.resolve("../../services/recoveryAuditStore.js");
const executionStorePath = require.resolve("../../services/recoveryExecutionStore.js");
const auditTrailPath = require.resolve("../../services/auditTrail.js");
const committerPath = require.resolve("../../services/recoveryCommitter.js");

function seedApprovedRequest(recoveryAuditStore: any, overrides: Record<string, unknown> = {}) {
  recoveryAuditStore.recordRecoveryRequest({
    recoveryRequestId: "recovery_1",
    executionId: "exec_1",
    recoveryMode: overrides.recoveryMode || "resume",
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
      replayCandidates: [{ classification: overrides.classification || "SAFE_REPLAY" }],
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
    },
  });
  recoveryAuditStore.recordApproval({
    recoveryRequestId: "recovery_1",
    executionId: "exec_1",
    approvedBy: "operator_2",
  });
}

function loadRunner() {
  delete require.cache[runnerPath];
  delete require.cache[executionStorePath];
  delete require.cache[recoveryAuditStorePath];
  require.cache[recoveryControllerPath] = {
    id: recoveryControllerPath,
    filename: recoveryControllerPath,
    loaded: true,
    exports: {
      commitRecovery: mockedCommitRecovery,
    },
  } as any;
  require.cache[committerPath] = {
    id: committerPath,
    filename: committerPath,
    loaded: true,
    exports: {
      commitRecoveryPlan: () => {
        throw new Error("D-11 must not call D-6 directly");
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
  return require("../../services/recoveryExecutionRunner.js");
}

beforeEach(() => {
  events.splice(0, events.length);
  mockedCommitRecovery.mockReset();
});

describe("recovery execution runner", () => {
  it("dry run performs no D-7 commit", async () => {
    const runner = loadRunner();
    const recoveryAuditStore = require("../../services/recoveryAuditStore.js");
    seedApprovedRequest(recoveryAuditStore);

    const result = await runner.runApprovedRecoveryExecution({
      requestedBy: "operator_1",
      limit: 5,
      dryRun: true,
      modes: { executionAllowlist: ["resume"] },
    });

    expect(result.ok).toBe(true);
    expect(mockedCommitRecovery).not.toHaveBeenCalled();
  });

  it("routes commit through D-7 only and suppresses duplicates", async () => {
    const runner = loadRunner();
    const recoveryAuditStore = require("../../services/recoveryAuditStore.js");
    seedApprovedRequest(recoveryAuditStore);
    mockedCommitRecovery.mockResolvedValue({
      ok: true,
      data: { committed: true },
    });

    const first = await runner.runApprovedRecoveryExecution({
      requestedBy: "operator_1",
      limit: 5,
      dryRun: false,
      modes: { executionAllowlist: ["resume"] },
    });
    expect(first).toEqual(
      expect.objectContaining({
        ok: true,
        data: expect.objectContaining({
          committed: 1,
        }),
      }),
    );
    expect(mockedCommitRecovery).toHaveBeenCalledWith({
      recoveryRequestId: "recovery_1",
      requestedBy: "operator_1",
      dryRun: false,
    });

    const second = await runner.runApprovedRecoveryExecution({
      requestedBy: "operator_1",
      limit: 5,
      dryRun: false,
      modes: { executionAllowlist: ["resume"] },
    });
    expect(second.ok).toBe(true);
    expect(second.data.committed).toBe(0);
  });

  it("stale failures become blocked and generic commit failures become failed", async () => {
    const runner = loadRunner();
    const recoveryAuditStore = require("../../services/recoveryAuditStore.js");
    seedApprovedRequest(recoveryAuditStore);
    mockedCommitRecovery.mockResolvedValueOnce({
      ok: false,
      code: "STALE_RECOVERY_PLAN",
      message: "stale",
    });

    const stale = await runner.runApprovedRecoveryExecution({
      requestedBy: "operator_1",
      limit: 5,
      dryRun: false,
      modes: { executionAllowlist: ["resume"] },
    });
    expect(stale.ok).toBe(true);
    expect(stale.data.blocked).toBe(1);

    events.splice(0, events.length);
    mockedCommitRecovery.mockReset();
    const runner2 = loadRunner();
    const recoveryAuditStore2 = require("../../services/recoveryAuditStore.js");
    seedApprovedRequest(recoveryAuditStore2);
    mockedCommitRecovery.mockResolvedValueOnce({
      ok: false,
      code: "RECOVERY_COMMIT_FAILED",
      message: "failure",
    });

    const failed = await runner2.runApprovedRecoveryExecution({
      requestedBy: "operator_1",
      limit: 5,
      dryRun: false,
      modes: { executionAllowlist: ["resume"] },
    });
    expect(failed.ok).toBe(true);
    expect(failed.data.failed).toBe(1);
  });
});

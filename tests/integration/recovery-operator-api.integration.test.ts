import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const events: Array<Record<string, unknown>> = [];

const auditTrailPath = require.resolve("../../services/auditTrail.js");
const stateDatabasePath = require.resolve("../../services/stateDatabase.js");
const runtimePathsPath = require.resolve("../../services/runtimePaths.js");
const executionStateStorePath = require.resolve("../../services/executionStateStore.js");
const executionIntegrityStorePath = require.resolve("../../services/executionIntegrityStore.js");
const recoveryAuditStorePath = require.resolve("../../services/recoveryAuditStore.js");
const recoveryAdvisoryStorePath = require.resolve("../../services/recoveryAdvisoryStore.js");
const recoveryAutomationStorePath = require.resolve("../../services/recoveryAutomationStore.js");
const recoveryAutonomyStorePath = require.resolve("../../services/recoveryAutonomyStore.js");
const recoveryExecutionStorePath = require.resolve("../../services/recoveryExecutionStore.js");
const recoveryVerificationStorePath = require.resolve("../../services/recoveryVerificationStore.js");
const recoveryLearningStorePath = require.resolve("../../services/recoveryLearningStore.js");
const recoveryControllerPath = require.resolve("../../services/recoveryController.js");
const recoveryCommitterPath = require.resolve("../../services/recoveryCommitter.js");

function clearModule(modulePath: string) {
  delete require.cache[modulePath];
}

async function loadRuntime() {
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
  vi.resetModules();
  for (const modulePath of [
    stateDatabasePath,
    runtimePathsPath,
    executionStateStorePath,
    executionIntegrityStorePath,
    recoveryAuditStorePath,
    recoveryAdvisoryStorePath,
    recoveryAutomationStorePath,
    recoveryAutonomyStorePath,
    recoveryExecutionStorePath,
    recoveryVerificationStorePath,
    recoveryLearningStorePath,
  ]) {
    clearModule(modulePath);
  }

  require.cache[recoveryCommitterPath] = {
    id: recoveryCommitterPath,
    filename: recoveryCommitterPath,
    loaded: true,
    exports: {
      commitRecoveryPlan: () => {
        throw new Error("3.5C must not call D-6 commit");
      },
    },
  } as any;
  require.cache[recoveryControllerPath] = {
    id: recoveryControllerPath,
    filename: recoveryControllerPath,
    loaded: true,
    exports: {
      approveRecovery: () => {
        throw new Error("3.5C must not call D-7 approve");
      },
      commitRecovery: () => {
        throw new Error("3.5C must not call D-7 commit");
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
          timestamp: new Date(1700000000000 + events.length * 1000).toISOString(),
          ...event,
        };
        events.push(entry);
        return entry;
      },
      listAuditEvents: (limit = 5000) => [...events].slice(-Math.max(1, Number(limit || 5000))).reverse(),
      clearAuditEvents: () => {
        events.splice(0, events.length);
      },
    },
  } as any;

  const stateDatabase = require("../../services/stateDatabase.js");
  const executionStateStore = require("../../services/executionStateStore.js");
  const executionIntegrityStore = require("../../services/executionIntegrityStore.js");
  const recoveryAdvisoryStore = require("../../services/recoveryAdvisoryStore.js");
  const recoveryVerificationStore = require("../../services/recoveryVerificationStore.js");
  const recoveryLearningStore = require("../../services/recoveryLearningStore.js");
  const recoveryVerificationController = require("../../services/recoveryVerificationController.js");
  const controller = await import("../../controllers/recoveryOperatorController.ts");

  executionStateStore.clearExecutionStateForTests();

  return {
    stateDatabase,
    executionStateStore,
    executionIntegrityStore,
    recoveryAdvisoryStore,
    recoveryVerificationStore,
    recoveryLearningStore,
    recoveryVerificationController,
    controller,
  };
}

function seedExecutionSnapshot(executionStateStore: any, executionId: string, status = "running") {
  const plan = {
    id: `plan_${executionId}`,
    steps: [
      {
        id: "step_0",
        action: "read_file",
        payload: "file.txt",
        metadata: {
          idempotent: true,
          retryStrategy: "safe",
        },
      },
    ],
  };
  executionStateStore.startExecutionState(plan);
  executionStateStore.persistExecutionSnapshot({
    runId: executionId,
    planId: plan.id,
    globalState: status,
    reviewStatus: status === "paused_for_review" ? "pending" : "approved",
    triggerSource: "api",
    steps: [
      {
        id: "step_0",
        sequence: 1,
        stageId: "stage_1",
        status: status === "running" ? "pending" : status,
        action: "read_file",
        kind: "read_file",
        originalInput: "file.txt",
        normalizedInput: "file.txt",
        idempotencyClass: "safe_repeat",
        isIdempotent: true,
        sideEffects: [],
      },
    ],
    stages: [
      {
        id: "stage_1",
        sequence: 1,
        name: "Stage 1",
        status,
      },
    ],
  });
  return plan.id;
}

beforeEach(() => {
  events.splice(0, events.length);
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
});

describe("recovery operator API integration", () => {
  it("full operator flow: failure -> advisory -> request -> recovery -> verification", async () => {
    const runtime = await loadRuntime();
    try {
      const planId = seedExecutionSnapshot(runtime.executionStateStore, "exec_op_1", "failed");
      runtime.executionIntegrityStore.appendLedgerEvent({ planId, executionId: "exec_op_1", eventType: "execution.failed", payload: {} });
      runtime.recoveryAdvisoryStore.recordAdvisoryCreated({ advisoryId: "adv_op_1", executionId: "exec_op_1", candidate: { signalType: "FAILED_EXECUTION" }, requestedBy: "system" });
      const view = await runtime.controller.getRecoveryOperatorView({ executionId: "exec_op_1", nowMs: 1700000000000 });
      expect(view.ok).toBe(true);
      const escalate = await runtime.controller.escalateRecoveryOperatorAdvisory({
        executionId: "exec_op_1",
        escalatedBy: "operator_1",
        reason: "needs review",
        nowMs: 1700000000000,
      });
      expect(escalate.ok).toBe(true);
      const verification = await runtime.controller.requestRecoveryOperatorVerification({
        executionId: "exec_op_1",
        requestedBy: "operator_1",
        nowMs: 1700000000000,
      });
      expect(verification.ok).toBe(true);
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("mismatch scenario blocks actions", async () => {
    const runtime = await loadRuntime();
    try {
      seedExecutionSnapshot(runtime.executionStateStore, "exec_op_2", "running");
      runtime.recoveryVerificationStore.recordVerificationResult({
        recoveryRequestId: "recovery_op_2",
        executionId: "exec_op_2",
        verification: { outcome: "VERIFIED", verified: true, reason: "ok" },
        requestedBy: "operator_1",
      });
      const result = await runtime.controller.requestRecoveryOperatorVerification({
        executionId: "exec_op_2",
        requestedBy: "operator_1",
        nowMs: 1700000000000,
      });
      expect(result).toEqual(
        expect.objectContaining({
          ok: false,
          error: "BLOCKED_UNSAFE_OPERATOR_ACTION",
        }),
      );
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("match scenario allows actions", async () => {
    const runtime = await loadRuntime();
    try {
      seedExecutionSnapshot(runtime.executionStateStore, "exec_op_3", "running");
      runtime.recoveryAdvisoryStore.recordAdvisoryCreated({ advisoryId: "adv_op_3", executionId: "exec_op_3", candidate: { signalType: "FAILED_EXECUTION" }, requestedBy: "system" });
      const result = await runtime.controller.dismissRecoveryOperatorAdvisory({
        executionId: "exec_op_3",
        dismissedBy: "operator_1",
        reason: "resolved",
        nowMs: 1700000000000,
      });
      expect(result.ok).toBe(true);
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("API reflects read model + timeline", async () => {
    const runtime = await loadRuntime();
    try {
      const planId = seedExecutionSnapshot(runtime.executionStateStore, "exec_op_4", "running");
      runtime.executionIntegrityStore.appendLedgerEvent({ planId, executionId: "exec_op_4", eventType: "execution.started", payload: {} });
      const result = await runtime.controller.getRecoveryOperatorView({ executionId: "exec_op_4", nowMs: 1700000000000 });
      expect(result.ok && result.data.readModel.executionId).toBe("exec_op_4");
      expect(result.ok && result.data.timeline.executionId).toBe("exec_op_4");
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("no runtime mutation", async () => {
    const runtime = await loadRuntime();
    try {
      seedExecutionSnapshot(runtime.executionStateStore, "exec_op_5", "running");
      const before = runtime.executionStateStore.getResumableExecutions().length;
      await runtime.controller.getRecoveryOperatorView({ executionId: "exec_op_5", nowMs: 1700000000000 });
      const after = runtime.executionStateStore.getResumableExecutions().length;
      expect(after).toBe(before);
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });
});

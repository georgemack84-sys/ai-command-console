import { beforeEach, describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const events: Array<Record<string, unknown>> = [];

const require = createRequire(import.meta.url);
const runnerPath = require.resolve("../../services/recoveryVerificationRunner.js");
const auditTrailPath = require.resolve("../../services/auditTrail.js");
const verificationStorePath = require.resolve("../../services/recoveryVerificationStore.js");
const recoveryAuditStorePath = require.resolve("../../services/recoveryAuditStore.js");
const executionStorePath = require.resolve("../../services/recoveryExecutionStore.js");
const committerPath = require.resolve("../../services/recoveryCommitter.js");
const recoveryControllerPath = require.resolve("../../services/recoveryController.js");
const stateDatabasePath = require.resolve("../../services/stateDatabase.js");
const runtimePathsPath = require.resolve("../../services/runtimePaths.js");
const executionStateStorePath = require.resolve("../../services/executionStateStore.js");

function loadRuntime() {
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
  for (const modulePath of [
    runnerPath,
    verificationStorePath,
    recoveryAuditStorePath,
    executionStorePath,
    executionStateStorePath,
    stateDatabasePath,
    runtimePathsPath,
  ]) {
    delete require.cache[modulePath];
  }

  require.cache[committerPath] = {
    id: committerPath,
    filename: committerPath,
    loaded: true,
    exports: {
      commitRecoveryPlan: () => {
        throw new Error("D-12 must not call D-6 commit");
      },
    },
  } as any;
  require.cache[recoveryControllerPath] = {
    id: recoveryControllerPath,
    filename: recoveryControllerPath,
    loaded: true,
    exports: {
      commitRecovery: () => {
        throw new Error("D-12 must not call D-7 commit");
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

  const stateDatabase = require("../../services/stateDatabase.js");
  const executionStateStore = require("../../services/executionStateStore.js");
  const recoveryAuditStore = require("../../services/recoveryAuditStore.js");
  const executionStore = require("../../services/recoveryExecutionStore.js");
  const runner = require("../../services/recoveryVerificationRunner.js");

  executionStateStore.clearExecutionStateForTests();

  return {
    stateDatabase,
    executionStateStore,
    recoveryAuditStore,
    executionStore,
    runner,
  };
}

function seedExecutionSnapshot(executionStateStore: any, executionId: string, status = "running") {
  const plan = {
    id: "plan_verify",
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
}

function seedCommittedExecution(recoveryAuditStore: any, executionStore: any) {
  recoveryAuditStore.recordRecoveryRequest({
    recoveryRequestId: "recovery_1",
    executionId: "exec_1",
    recoveryMode: "resume",
    requestedBy: "operator_1",
    plan: { executionId: "exec_1", planId: "plan_verify" },
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
  executionStore.recordExecutionPolicyEvaluated({
    recoveryRequestId: "recovery_1",
    executionId: "exec_1",
    policy: { action: "commit_approved" },
    requestedBy: "operator_1",
  });
  executionStore.recordExecutionGateAllowed({
    recoveryRequestId: "recovery_1",
    executionId: "exec_1",
    gate: { allowed: true },
    requestedBy: "operator_1",
  });
  executionStore.recordExecutionCommitAttempted({
    recoveryRequestId: "recovery_1",
    executionId: "exec_1",
    requestedBy: "operator_1",
    dryRun: false,
  });
}

beforeEach(() => {
  events.splice(0, events.length);
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
});

describe("recovery verification runner", () => {
  it("verifies committed outcomes and dryRun does not record verification events", () => {
    const { stateDatabase, executionStateStore, recoveryAuditStore, executionStore, runner } = loadRuntime();

    try {
      seedExecutionSnapshot(executionStateStore, "exec_1", "paused_for_review");
      seedCommittedExecution(recoveryAuditStore, executionStore);

      const before = stateDatabase.withDatabase((db: any) => ({
        verificationEvents: db.prepare("SELECT COUNT(*) AS total FROM audit_events").get().total,
      }));

      const dryRun = runner.runRecoveryVerification({
        requestedBy: "operator_1",
        limit: 5,
        dryRun: true,
      });

      expect(dryRun.ok).toBe(true);

      const after = stateDatabase.withDatabase((db: any) => ({
        verificationEvents: db.prepare("SELECT COUNT(*) AS total FROM audit_events").get().total,
      }));
      expect(after).toEqual(before);
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("records verification results for committed, stale-blocked, and failed execution outcomes", () => {
    const { stateDatabase, executionStateStore, recoveryAuditStore, executionStore, runner } = loadRuntime();

    try {
      seedExecutionSnapshot(executionStateStore, "exec_1", "running");
      seedCommittedExecution(recoveryAuditStore, executionStore);
      executionStore.recordExecutionCommitted({
        recoveryRequestId: "recovery_1",
        executionId: "exec_1",
        requestedBy: "operator_1",
        result: { committed: true },
      });

      const committed = runner.runRecoveryVerification({
        requestedBy: "operator_1",
        limit: 5,
        dryRun: false,
      });
      expect(committed.ok).toBe(true);
      expect(committed.data.verified).toBe(1);

      events.splice(0, events.length);
      const runtime2 = loadRuntime();
      seedExecutionSnapshot(runtime2.executionStateStore, "exec_1", "running");
      seedCommittedExecution(runtime2.recoveryAuditStore, runtime2.executionStore);
      runtime2.executionStore.recordExecutionBlocked({
        recoveryRequestId: "recovery_1",
        executionId: "exec_1",
        requestedBy: "operator_1",
        result: { code: "STALE_RECOVERY_PLAN" },
      });
      const blocked = runtime2.runner.runRecoveryVerification({
        requestedBy: "operator_1",
        limit: 5,
        dryRun: false,
      });
      expect(blocked.ok).toBe(true);
      expect(blocked.data.noMutationConfirmed).toBe(1);
      runtime2.stateDatabase.closeDatabase();

      events.splice(0, events.length);
      const runtime3 = loadRuntime();
      seedExecutionSnapshot(runtime3.executionStateStore, "exec_1", "running");
      seedCommittedExecution(runtime3.recoveryAuditStore, runtime3.executionStore);
      runtime3.executionStore.recordExecutionFailed({
        recoveryRequestId: "recovery_1",
        executionId: "exec_1",
        requestedBy: "operator_1",
        result: { code: "RECOVERY_COMMIT_FAILED" },
      });
      const failed = runtime3.runner.runRecoveryVerification({
        requestedBy: "operator_1",
        limit: 5,
        dryRun: false,
      });
      expect(failed.ok).toBe(true);
      expect(failed.data.manualReviewRequired).toBe(1);
      runtime3.stateDatabase.closeDatabase();
    } finally {
      stateDatabase.closeDatabase();
    }
  });
});

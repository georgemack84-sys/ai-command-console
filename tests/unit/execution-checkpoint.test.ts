import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";

vi.mock("../../services/auditTrail", () => ({
  appendAuditEvent: vi.fn((event: Record<string, unknown>) => ({
    id: `audit_${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...event,
  })),
  listAuditEvents: vi.fn(() => []),
  clearAuditEvents: vi.fn(),
}));

vi.mock("../../services/toolRouter", () => ({
  route: vi.fn(),
}));

const require = createRequire(import.meta.url);
const stateDatabasePath = require.resolve("../../services/stateDatabase.js");
const runtimePathsPath = require.resolve("../../services/runtimePaths.js");
const executionStateStorePath = require.resolve("../../services/executionStateStore.js");
const executionReconciliationPath = require.resolve("../../services/executionReconciliation.js");
const executionIntegrityStorePath = require.resolve("../../services/executionIntegrityStore.js");
const reviewSurfacePath = require.resolve("../../services/reviewSurface.js");
const stepControllerPath = require.resolve("../../services/stepController.js");
const executionEnginePath = require.resolve("../../services/executionEngine.js");

function loadRuntime() {
  vi.doUnmock("../../services/executionIntegrityStore.js");
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
  for (const modulePath of [
    executionEnginePath,
    executionReconciliationPath,
    executionIntegrityStorePath,
    stepControllerPath,
    reviewSurfacePath,
    executionStateStorePath,
    stateDatabasePath,
    runtimePathsPath,
  ]) {
    delete require.cache[modulePath];
  }

  const stateDatabase = require("../../services/stateDatabase.js");
  const executionStateStore = require("../../services/executionStateStore.js");
  const executionIntegrityStore = require("../../services/executionIntegrityStore.js");
  const reviewSurface = require("../../services/reviewSurface.js");
  const executionEngine = require("../../services/executionEngine.js");
  const toolRouter = require("../../services/toolRouter.js");

  executionStateStore.clearExecutionStateForTests();
  stateDatabase.saveDocument(reviewSurface.REVIEW_SURFACE_KEY, reviewSurface.defaultReviewSurfaceState());
  stateDatabase.saveDocument("execution-orchestration-state", {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    globalState: "idle",
    runs: [],
    bootstraps: [],
    approvalQueue: [],
    anomalies: [],
    safeMode: { enabled: false, enteredAt: null, reason: null },
    sequenceLearning: { status: "GAP_UNKNOWN_STRUCTURE" },
  });

  return {
    stateDatabase,
    executionStateStore,
    executionIntegrityStore,
    reviewSurface,
    executionEngine,
    toolRouter,
  };
}

function makePlan(stepCount = 3, overrides: Record<string, unknown> = {}) {
  const steps = Array.from({ length: stepCount }, (_, index) => ({
    id: `step_${index}`,
    action: "read_file",
    payload: `file_${index}.txt`,
    metadata: {
      idempotent: true,
      retryStrategy: "safe",
    },
  }));

  return {
    id: "plan_checkpoint",
    type: stepCount === 1 ? "single" : "multi",
    originalRequest: "checkpoint test",
    reviewStatus: "approved",
    currentStageExecutable: true,
    finalMode: "auto_execute",
    steps,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("execution checkpoint persistence", () => {
  it("creates initial execution state on start", () => {
    const { executionStateStore, stateDatabase } = loadRuntime();

    try {
      const result = executionStateStore.startExecutionState(makePlan());
      expect(result).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            planId: "plan_checkpoint",
            status: "pending",
            currentStep: 0,
            lastCompletedStepIndex: -1,
          }),
        })
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("does not overwrite an existing active execution", () => {
    const { executionStateStore, stateDatabase } = loadRuntime();

    try {
      expect(executionStateStore.startExecutionState(makePlan()).ok).toBe(true);
      const second = executionStateStore.startExecutionState(makePlan());
      expect(second).toEqual(
        expect.objectContaining({
          ok: false,
          code: "EXECUTION_ALREADY_EXISTS",
        })
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("describes execution state when engine start hits an existing checkpoint", async () => {
    const { executionEngine, executionStateStore, stateDatabase } = loadRuntime();

    try {
      expect(executionStateStore.startExecutionState(makePlan()).ok).toBe(true);

      const result = await executionEngine.execute(makePlan(1), {
        executionMode: "auto_execute",
        controlApproved: true,
        triggerSource: "api",
      });

      expect(result).toEqual(
        expect.objectContaining({
          ok: false,
          code: "EXECUTION_ALREADY_EXISTS",
          state: expect.objectContaining({
            planId: "plan_checkpoint",
            checkpoint: expect.objectContaining({
              status: "pending",
              currentStep: 0,
              lastCompletedStepIndex: -1,
            }),
            diagnostics: expect.objectContaining({
              summary: expect.any(Object),
            }),
          }),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("describes execution state when engine start hits a persisted lock conflict", async () => {
    const { executionEngine, executionIntegrityStore, stateDatabase } = loadRuntime();

    try {
      const locked = executionIntegrityStore.acquireExecutionLock("plan_checkpoint", "exec_locked");
      expect(locked.ok).toBe(true);

      const result = await executionEngine.execute(makePlan(1), {
        executionMode: "auto_execute",
        controlApproved: true,
        triggerSource: "api",
      });

      expect(result).toEqual(
        expect.objectContaining({
          ok: false,
          code: "LOCK_CONFLICT",
          state: expect.objectContaining({
            planId: "plan_checkpoint",
            activeLock: expect.objectContaining({
              executionId: "exec_locked",
            }),
            checkpoint: null,
            diagnostics: expect.objectContaining({
              activeLock: expect.objectContaining({
                executionId: "exec_locked",
              }),
            }),
          }),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("updates checkpoint state after successful steps", () => {
    const { executionStateStore, stateDatabase } = loadRuntime();

    try {
      executionStateStore.startExecutionState(makePlan(2));
      const before = executionStateStore.checkpointBeforeStep("plan_checkpoint", 0);
      const after = executionStateStore.checkpointAfterStep("plan_checkpoint", 0, 2);

      expect(before.ok).toBe(true);
      expect(after).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            currentStep: 1,
            lastCompletedStepIndex: 0,
            status: "running",
            updatedAt: expect.any(Number),
          }),
        })
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("resumes recovery from the correct step without rerunning completed work", async () => {
    const { executionStateStore, executionEngine, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const plan = makePlan(5);
      executionStateStore.startExecutionState(plan);
      executionStateStore.checkpointAfterStep(plan.id, 0, 5);
      executionStateStore.checkpointAfterStep(plan.id, 1, 5);
      executionStateStore.checkpointAfterStep(plan.id, 2, 5);

      const recovered = await executionEngine.recoverExecution(plan, {
        executionMode: "auto_execute",
        controlApproved: true,
        triggerSource: "api",
      });

      expect(recovered.ok).toBe(true);
      expect(toolRouter.route.mock.calls.map((call: Array<{ id: string }>) => call[0].id)).toEqual(["step_3", "step_4"]);
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("does not rerun completed steps during recovery", async () => {
    const { executionStateStore, executionEngine, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const plan = makePlan(4);
      executionStateStore.startExecutionState(plan);
      executionStateStore.checkpointAfterStep(plan.id, 0, 4);
      executionStateStore.checkpointAfterStep(plan.id, 1, 4);

      await executionEngine.recoverExecution(plan, {
        executionMode: "auto_execute",
        controlApproved: true,
        triggerSource: "api",
      });

      expect(toolRouter.route).toHaveBeenCalledTimes(2);
      expect(toolRouter.route.mock.calls.map((call: Array<{ id: string }>) => call[0].id)).toEqual(["step_2", "step_3"]);
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("marks the final checkpoint as completed", () => {
    const { executionStateStore, stateDatabase } = loadRuntime();

    try {
      executionStateStore.startExecutionState(makePlan(1));
      const result = executionStateStore.checkpointAfterStep("plan_checkpoint", 0, 1);
      expect(result).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            status: "completed",
            lastCompletedStepIndex: 0,
            currentStep: 1,
          }),
        })
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("pauses recovery when an interrupted step has no terminal attempt ledger", async () => {
    const { executionStateStore, executionIntegrityStore, executionEngine, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const plan = makePlan(2);
      executionStateStore.startExecutionState(plan);
      executionStateStore.checkpointBeforeStep(plan.id, 0);
      executionIntegrityStore.acquireExecutionLock(plan.id, "exec_recover");
      executionIntegrityStore.createExecutionAttempt({
        planId: plan.id,
        executionId: "exec_recover",
        stepId: "step_0",
        sideEffectClass: "pure_read",
      });
      stateDatabase.withDatabase((db: { prepare: (sql: string) => { run: (...args: Array<unknown>) => unknown } }) =>
        db.prepare("UPDATE execution_attempts SET lease_expires_at = 0 WHERE plan_id = ?").run(plan.id),
      );

      const recovered = await executionEngine.recoverExecution(plan, {
        executionMode: "auto_execute",
        controlApproved: true,
        triggerSource: "api",
      });

      expect(recovered).toEqual(
        expect.objectContaining({
          ok: false,
          requiresReview: true,
          code: "MANUAL_REVIEW_REQUIRED",
          checkpoint: expect.objectContaining({
            status: "pause_for_operator_recovery",
          }),
        }),
      );
      expect(toolRouter.route).not.toHaveBeenCalled();
      const locks = executionIntegrityStore.listExecutionLocks(plan.id);
      expect(locks).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              executionId: "exec_recover",
              lockReleasedAt: expect.any(Number),
            }),
          ]),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("marks recovery as corrupted when the persisted step snapshot is completed without terminal ledger evidence", async () => {
    const { executionStateStore, executionIntegrityStore, executionEngine, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const plan = makePlan(2);
      executionStateStore.startExecutionState(plan);
      executionStateStore.checkpointBeforeStep(plan.id, 0);
      executionIntegrityStore.acquireExecutionLock(plan.id, "exec_snapshot_mismatch");
      executionStateStore.persistExecutionSnapshot({
        runId: "exec_snapshot_mismatch",
        planId: plan.id,
        globalState: "running",
        reviewStatus: "approved",
        triggerSource: "api",
        steps: [
          {
            id: "step_0",
            sequence: 1,
            stageId: "stage_1",
            status: "completed",
            action: "read_file",
            originalInput: "file_0.txt",
            normalizedInput: "file_0.txt",
            startedAt: new Date().toISOString(),
            finishedAt: new Date().toISOString(),
          },
          {
            id: "step_1",
            sequence: 2,
            stageId: "stage_1",
            status: "pending",
            action: "read_file",
            originalInput: "file_1.txt",
            normalizedInput: "file_1.txt",
          },
        ],
        stages: [
          {
            id: "stage_1",
            sequence: 1,
            name: "Stage 1",
            status: "running",
          },
        ],
      });

      const recovered = await executionEngine.recoverExecution(plan, {
        executionMode: "auto_execute",
        controlApproved: true,
        triggerSource: "api",
      });

      expect(recovered).toEqual(
        expect.objectContaining({
          ok: false,
          code: "CORRUPTED",
          state: expect.objectContaining({
            checkpoint: expect.objectContaining({
              status: "corrupted",
            }),
          }),
        }),
      );
      expect(toolRouter.route).not.toHaveBeenCalled();
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("retries recovery when the interrupted step has a failed attempt ledger", async () => {
    const { executionStateStore, executionIntegrityStore, executionEngine, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const plan = makePlan(2);
      executionStateStore.startExecutionState(plan);
      executionStateStore.checkpointBeforeStep(plan.id, 0);
      executionIntegrityStore.acquireExecutionLock(plan.id, "exec_recover_failed");
      const attempt = executionIntegrityStore.createExecutionAttempt({
        planId: plan.id,
        executionId: "exec_recover_failed",
        stepId: "step_0",
        sideEffectClass: "pure_read",
      });
      expect(attempt.ok).toBe(true);
      const failed = executionIntegrityStore.failExecutionAttempt(
        plan.id,
        "exec_recover_failed",
        "step_0",
        1,
        { error: "boom", type: "execution_failure" },
      );
      expect(failed.ok).toBe(true);
      stateDatabase.withDatabase((db: { prepare: (sql: string) => { run: (...args: Array<unknown>) => unknown } }) =>
        db.prepare("UPDATE execution_attempts SET lease_expires_at = 0 WHERE plan_id = ?").run(plan.id),
      );

      const recovered = await executionEngine.recoverExecution(plan, {
        executionMode: "auto_execute",
        controlApproved: true,
        triggerSource: "api",
      });

      expect(recovered.ok).toBe(true);
      expect(toolRouter.route.mock.calls.map((call: Array<{ id: string }>) => call[0].id)).toEqual(["step_0", "step_1"]);
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("routes failed local-write recovery to operator review without idempotency evidence", async () => {
    const { executionStateStore, executionIntegrityStore, executionEngine, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const plan = makePlan(2, {
        steps: [
          {
            id: "step_0",
            action: "write_file",
            payload: "out.txt",
            metadata: {
              idempotent: false,
              retryStrategy: "manual_only",
              sideEffectClass: "local_write",
              sideEffects: ["filesystem"],
            },
          },
          {
            id: "step_1",
            action: "read_file",
            payload: "out.txt",
            metadata: {
              idempotent: true,
              retryStrategy: "safe",
              sideEffectClass: "pure_read",
            },
          },
        ],
      });
      executionStateStore.startExecutionState(plan);
      executionStateStore.checkpointBeforeStep(plan.id, 0);
      executionIntegrityStore.acquireExecutionLock(plan.id, "exec_local_write_recover");
      const attempt = executionIntegrityStore.createExecutionAttempt({
        planId: plan.id,
        executionId: "exec_local_write_recover",
        stepId: "step_0",
        sideEffectClass: "local_write",
      });
      expect(attempt.ok).toBe(true);
      const failed = executionIntegrityStore.failExecutionAttempt(
        plan.id,
        "exec_local_write_recover",
        "step_0",
        1,
        { error: "boom", type: "execution_failure" },
      );
      expect(failed.ok).toBe(true);
      stateDatabase.withDatabase((db: { prepare: (sql: string) => { run: (...args: Array<unknown>) => unknown } }) =>
        db.prepare("UPDATE execution_attempts SET lease_expires_at = 0 WHERE plan_id = ?").run(plan.id),
      );

      const recovered = await executionEngine.recoverExecution(plan, {
        executionMode: "auto_execute",
        controlApproved: true,
        triggerSource: "api",
      });

      expect(recovered).toEqual(
        expect.objectContaining({
          ok: false,
          requiresReview: true,
          code: "MANUAL_REVIEW_REQUIRED",
          checkpoint: expect.objectContaining({
            status: "pause_for_operator_recovery",
          }),
          recoveryQueue: expect.arrayContaining([
            expect.objectContaining({
              reason: "unsafe_recovery_local_write",
            }),
          ]),
        }),
      );
      expect(toolRouter.route).not.toHaveBeenCalled();
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("routes failed network-call recovery to operator review even when idempotency evidence is present", async () => {
    const { executionStateStore, executionIntegrityStore, executionEngine, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const plan = makePlan(2, {
        steps: [
          {
            id: "step_0",
            action: "api_call",
            payload: "deploy",
            metadata: {
              idempotent: true,
              retryStrategy: "safe",
              sideEffectClass: "network_call",
              sideEffects: ["network"],
            },
          },
          {
            id: "step_1",
            action: "read_file",
            payload: "out.txt",
            metadata: {
              idempotent: true,
              retryStrategy: "safe",
              sideEffectClass: "pure_read",
            },
          },
        ],
      });
      executionStateStore.startExecutionState(plan);
      executionStateStore.checkpointBeforeStep(plan.id, 0);
      executionIntegrityStore.acquireExecutionLock(plan.id, "exec_network_retry");
      const attempt = executionIntegrityStore.createExecutionAttempt({
        planId: plan.id,
        executionId: "exec_network_retry",
        stepId: "step_0",
        sideEffectClass: "network_call",
        idempotencyKey: "retry-safe-key",
      });
      expect(attempt.ok).toBe(true);
      const failed = executionIntegrityStore.failExecutionAttempt(
        plan.id,
        "exec_network_retry",
        "step_0",
        1,
        { error: "boom", type: "execution_failure" },
      );
      expect(failed.ok).toBe(true);
      stateDatabase.withDatabase((db: { prepare: (sql: string) => { run: (...args: Array<unknown>) => unknown } }) =>
        db.prepare("UPDATE execution_attempts SET lease_expires_at = 0 WHERE plan_id = ?").run(plan.id),
      );

      const recovered = await executionEngine.recoverExecution(plan, {
        executionMode: "auto_execute",
        controlApproved: true,
        triggerSource: "api",
      });

      expect(recovered).toEqual(
        expect.objectContaining({
          ok: false,
          requiresReview: true,
          code: "MANUAL_REVIEW_REQUIRED",
          checkpoint: expect.objectContaining({
            status: "pause_for_operator_recovery",
          }),
          recoveryQueue: expect.arrayContaining([
            expect.objectContaining({
              reason: "unsafe_recovery_network_call",
            }),
          ]),
        }),
      );
      expect(toolRouter.route).not.toHaveBeenCalled();
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("routes failed external-write recovery to operator review when retry strategy is manual-only", async () => {
    const { executionStateStore, executionIntegrityStore, executionEngine, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const plan = makePlan(2, {
        steps: [
          {
            id: "step_0",
            action: "run_command",
            payload: "deploy",
            metadata: {
              idempotent: true,
              retryStrategy: "manual_only",
              sideEffectClass: "external_write",
              sideEffects: ["network"],
            },
          },
          {
            id: "step_1",
            action: "read_file",
            payload: "out.txt",
            metadata: {
              idempotent: true,
              retryStrategy: "safe",
              sideEffectClass: "pure_read",
            },
          },
        ],
      });
      executionStateStore.startExecutionState(plan);
      executionStateStore.checkpointBeforeStep(plan.id, 0);
      executionIntegrityStore.acquireExecutionLock(plan.id, "exec_external_manual_only");
      const attempt = executionIntegrityStore.createExecutionAttempt({
        planId: plan.id,
        executionId: "exec_external_manual_only",
        stepId: "step_0",
        sideEffectClass: "external_write",
        idempotencyKey: "manual-only-key",
      });
      expect(attempt.ok).toBe(true);
      const failed = executionIntegrityStore.failExecutionAttempt(
        plan.id,
        "exec_external_manual_only",
        "step_0",
        1,
        { error: "boom", type: "execution_failure" },
      );
      expect(failed.ok).toBe(true);
      stateDatabase.withDatabase((db: { prepare: (sql: string) => { run: (...args: Array<unknown>) => unknown } }) =>
        db.prepare("UPDATE execution_attempts SET lease_expires_at = 0 WHERE plan_id = ?").run(plan.id),
      );

      const recovered = await executionEngine.recoverExecution(plan, {
        executionMode: "auto_execute",
        controlApproved: true,
        triggerSource: "api",
      });

      expect(recovered).toEqual(
        expect.objectContaining({
          ok: false,
          requiresReview: true,
          code: "MANUAL_REVIEW_REQUIRED",
          checkpoint: expect.objectContaining({
            status: "pause_for_operator_recovery",
          }),
          recoveryQueue: expect.arrayContaining([
            expect.objectContaining({
              reason: "unsafe_recovery_external_write",
            }),
          ]),
        }),
      );
      expect(toolRouter.route).not.toHaveBeenCalled();
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("routes failed recovery to operator review when side effects are unknown", async () => {
    const { executionStateStore, executionIntegrityStore, executionEngine, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const plan = makePlan(2, {
        steps: [
          {
            id: "step_0",
            action: "run_command",
            payload: "deploy",
            metadata: {
              idempotent: true,
              retryStrategy: "safe",
              sideEffectClass: "external_write",
              sideEffects: ["unknown"],
            },
          },
          {
            id: "step_1",
            action: "read_file",
            payload: "out.txt",
            metadata: {
              idempotent: true,
              retryStrategy: "safe",
              sideEffectClass: "pure_read",
            },
          },
        ],
      });
      executionStateStore.startExecutionState(plan);
      executionStateStore.checkpointBeforeStep(plan.id, 0);
      executionIntegrityStore.acquireExecutionLock(plan.id, "exec_unknown_effects");
      const attempt = executionIntegrityStore.createExecutionAttempt({
        planId: plan.id,
        executionId: "exec_unknown_effects",
        stepId: "step_0",
        sideEffectClass: "external_write",
        idempotencyKey: "retry-key",
      });
      expect(attempt.ok).toBe(true);
      const failed = executionIntegrityStore.failExecutionAttempt(
        plan.id,
        "exec_unknown_effects",
        "step_0",
        1,
        { error: "boom", type: "execution_failure" },
      );
      expect(failed.ok).toBe(true);
      stateDatabase.withDatabase((db: { prepare: (sql: string) => { run: (...args: Array<unknown>) => unknown } }) =>
        db.prepare("UPDATE execution_attempts SET lease_expires_at = 0 WHERE plan_id = ?").run(plan.id),
      );

      const recovered = await executionEngine.recoverExecution(plan, {
        executionMode: "auto_execute",
        controlApproved: true,
        triggerSource: "api",
      });

      expect(recovered).toEqual(
        expect.objectContaining({
          ok: false,
          requiresReview: true,
          code: "MANUAL_REVIEW_REQUIRED",
          checkpoint: expect.objectContaining({
            status: "pause_for_operator_recovery",
          }),
          recoveryQueue: expect.arrayContaining([
            expect.objectContaining({
              reason: "unsafe_recovery_external_write",
            }),
          ]),
        }),
      );
      expect(toolRouter.route).not.toHaveBeenCalled();
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("reuses the latest persisted execution identity during recovery when no active lock exists", async () => {
    const { executionStateStore, executionEngine, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const plan = makePlan(2);
      executionStateStore.startExecutionState(plan);
      executionStateStore.checkpointAfterStep(plan.id, 0, 2);
      executionStateStore.persistExecutionSnapshot({
        runId: "exec_persisted_recover",
        planId: plan.id,
        globalState: "running",
        reviewStatus: "approved",
        steps: [
          {
            id: "step_0",
            sequence: 1,
            stageId: "stage_1",
            status: "completed",
            action: "read_file",
            payload: "file_0.txt",
            reviewAcknowledged: true,
          },
          {
            id: "step_1",
            sequence: 2,
            stageId: "stage_1",
            status: "pending",
            action: "read_file",
            payload: "file_1.txt",
          },
        ],
        stages: [
          {
            id: "stage_1",
            sequence: 1,
            name: "Default Stage",
            status: "running",
          },
        ],
      });

      const recovered = await executionEngine.recoverExecution(plan, {
        executionMode: "auto_execute",
        controlApproved: true,
        triggerSource: "api",
      });

      expect(recovered.ok).toBe(true);
      expect(recovered.run.runId).toBe("exec_persisted_recover");
      expect(toolRouter.route.mock.calls.map((call: Array<{ id: string }>) => call[0].id)).toEqual(["step_1"]);
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("does not take over a running execution whose attempt lease is still active", async () => {
    const { executionStateStore, executionIntegrityStore, executionEngine, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const plan = makePlan(2);
      executionStateStore.startExecutionState(plan);
      executionStateStore.checkpointBeforeStep(plan.id, 0);
      executionIntegrityStore.acquireExecutionLock(plan.id, "exec_live");
      executionIntegrityStore.createExecutionAttempt({
        planId: plan.id,
        executionId: "exec_live",
        stepId: "step_0",
        sideEffectClass: "pure_read",
      });

      const recovered = await executionEngine.recoverExecution(plan, {
        executionMode: "auto_execute",
        controlApproved: true,
        triggerSource: "api",
      });

      expect(recovered).toEqual(
        expect.objectContaining({
          ok: false,
          code: "EXECUTION_ACTIVE",
          state: expect.objectContaining({
            planId: plan.id,
            activeLock: expect.objectContaining({
              executionId: "exec_live",
            }),
            diagnostics: expect.objectContaining({
              summary: expect.any(Object),
            }),
          }),
        }),
      );
      expect(toolRouter.route).not.toHaveBeenCalled();
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("reports eligible recovery preflight with the next checkpoint step", async () => {
    const { executionStateStore, executionEngine, stateDatabase } = loadRuntime();

    try {
      const plan = makePlan(4);
      executionStateStore.startExecutionState(plan);
      executionStateStore.checkpointAfterStep(plan.id, 0, 4);
      executionStateStore.checkpointAfterStep(plan.id, 1, 4);

      const preflight = await executionEngine.preflightRecovery(plan, {
        executionMode: "auto_execute",
        controlApproved: true,
        triggerSource: "api",
      });

      expect(preflight).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            eligible: true,
            checkpoint: expect.objectContaining({
              currentStep: 2,
              lastCompletedStepIndex: 1,
              status: "running",
            }),
            nextStep: expect.objectContaining({
              id: "step_2",
            }),
            executionId: expect.any(String),
          }),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("reports ineligible recovery preflight when an attempt lease is still active", async () => {
    const { executionStateStore, executionIntegrityStore, executionEngine, stateDatabase } = loadRuntime();

    try {
      const plan = makePlan(2);
      executionStateStore.startExecutionState(plan);
      executionStateStore.checkpointBeforeStep(plan.id, 0);
      executionIntegrityStore.acquireExecutionLock(plan.id, "exec_live_preflight");
      executionIntegrityStore.createExecutionAttempt({
        planId: plan.id,
        executionId: "exec_live_preflight",
        stepId: "step_0",
        sideEffectClass: "pure_read",
      });

      const preflight = await executionEngine.preflightRecovery(plan, {
        executionMode: "auto_execute",
        controlApproved: true,
        triggerSource: "api",
      });

      expect(preflight).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            eligible: false,
            reason: "EXECUTION_ACTIVE",
            code: "EXECUTION_ACTIVE",
            checkpoint: expect.objectContaining({
              status: "running",
            }),
            nextStep: null,
          }),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("does not take over a running execution whose mirrored execution lease is still active", async () => {
    const { executionStateStore, executionIntegrityStore, executionEngine, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const plan = makePlan(2);
      executionStateStore.startExecutionState(plan);
      executionStateStore.checkpointBeforeStep(plan.id, 0);
      executionStateStore.persistExecutionSnapshot({
        runId: "exec_live_execution_lease",
        planId: plan.id,
        globalState: "running",
        reviewStatus: "approved",
        steps: [
          {
            id: "step_0",
            sequence: 1,
            stageId: "stage_1",
            status: "running",
            action: "read_file",
            payload: "file_0.txt",
          },
          {
            id: "step_1",
            sequence: 2,
            stageId: "stage_1",
            status: "pending",
            action: "read_file",
            payload: "file_1.txt",
          },
        ],
        stages: [
          {
            id: "stage_1",
            sequence: 1,
            name: "Default Stage",
            status: "running",
          },
        ],
      });
      executionIntegrityStore.acquireExecutionLock(plan.id, "exec_live_execution_lease");
      executionIntegrityStore.createExecutionAttempt({
        planId: plan.id,
        executionId: "exec_live_execution_lease",
        stepId: "step_0",
        sideEffectClass: "pure_read",
      });
      stateDatabase.withDatabase((db: { prepare: (sql: string) => { run: (...args: Array<unknown>) => unknown } }) =>
        db.prepare("UPDATE execution_attempts SET lease_expires_at = 0 WHERE plan_id = ?").run(plan.id),
      );

      const recovered = await executionEngine.recoverExecution(plan, {
        executionMode: "auto_execute",
        controlApproved: true,
        triggerSource: "api",
      });

      expect(recovered).toEqual(
        expect.objectContaining({
          ok: false,
          code: "EXECUTION_ACTIVE",
          error: "Execution is still active and its execution lease has not expired.",
          state: expect.objectContaining({
            planId: plan.id,
            checkpoint: expect.objectContaining({
              status: "running",
            }),
          }),
        }),
      );
      expect(toolRouter.route).not.toHaveBeenCalled();
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("blocks recovery for interrupted non-idempotent steps", async () => {
    const { executionStateStore, executionEngine, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const plan = makePlan(2, {
        steps: [
          {
            id: "step_0",
            action: "write_file",
            payload: "out.txt",
            metadata: {
              idempotent: false,
              retryStrategy: "manual_only",
            },
          },
          {
            id: "step_1",
            action: "read_file",
            payload: "out.txt",
            metadata: {
              idempotent: true,
              retryStrategy: "safe",
            },
          },
        ],
      });
      executionStateStore.startExecutionState(plan);
      executionStateStore.checkpointBeforeStep(plan.id, 0);

      const recovered = await executionEngine.recoverExecution(plan, {
        executionMode: "auto_execute",
        controlApproved: true,
        triggerSource: "api",
      });

      expect(recovered).toEqual(
        expect.objectContaining({
          ok: false,
          code: "MANUAL_REVIEW_REQUIRED",
          state: expect.objectContaining({
            planId: plan.id,
            checkpoint: expect.objectContaining({
              status: "awaiting_review",
            }),
            recoveryQueue: expect.any(Array),
            diagnostics: expect.objectContaining({
              summary: expect.any(Object),
            }),
          }),
        }),
      );
      expect(toolRouter.route).not.toHaveBeenCalled();
      const checkpoint = executionStateStore.loadExecutionCheckpoint(plan.id);
      expect(checkpoint).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            status: "awaiting_review",
          }),
        })
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("rejects invalid checkpoints", async () => {
    const { executionStateStore, executionEngine, stateDatabase } = loadRuntime();

    try {
      const plan = makePlan(2);
      executionStateStore.startExecutionState(plan);
      stateDatabase.withDatabase((db: { prepare: (sql: string) => { run: (...args: Array<unknown>) => unknown } }) =>
        db
          .prepare("UPDATE execution_state SET lastCompletedStepIndex = ?, currentStep = ? WHERE planId = ?")
          .run(5, 6, plan.id)
      );

      const recovered = await executionEngine.recoverExecution(plan, {
        executionMode: "auto_execute",
        controlApproved: true,
        triggerSource: "api",
      });

      expect(recovered).toEqual(
        expect.objectContaining({
          ok: false,
          code: "CHECKPOINT_INVALID",
          state: expect.objectContaining({
            planId: plan.id,
            checkpoint: expect.objectContaining({
              currentStep: 6,
              lastCompletedStepIndex: 5,
            }),
            diagnostics: expect.objectContaining({
              summary: expect.any(Object),
            }),
          }),
          diagnostics: expect.objectContaining({
            planId: plan.id,
            summary: expect.any(Object),
          }),
          corruption: expect.objectContaining({
            planId: plan.id,
            corrupted: true,
          }),
        })
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("fails closed during preflight when recovery sees an invalid checkpoint even if lock release would fail later", async () => {
    const { executionStateStore, executionIntegrityStore, executionEngine, stateDatabase } = loadRuntime();

    try {
      const plan = makePlan(2);
      executionStateStore.startExecutionState(plan);
      executionIntegrityStore.acquireExecutionLock(plan.id, "exec_invalid_release_fail");
      stateDatabase.withDatabase((db: { prepare: (sql: string) => { run: (...args: Array<unknown>) => unknown }; exec: (sql: string) => void }) => {
        db
          .prepare("UPDATE execution_state SET lastCompletedStepIndex = ?, currentStep = ? WHERE planId = ?")
          .run(5, 6, plan.id);
        db.exec(`
          CREATE TRIGGER prevent_lock_release_on_invalid_checkpoint
          BEFORE UPDATE OF lock_released_at ON execution_locks
          WHEN NEW.lock_released_at IS NOT NULL
          BEGIN
            SELECT RAISE(FAIL, 'lock release failed');
          END;
        `);
      });

      const recovered = await executionEngine.recoverExecution(plan, {
        executionMode: "auto_execute",
        controlApproved: true,
        triggerSource: "api",
      });

      expect(recovered).toEqual(
        expect.objectContaining({
          ok: false,
          code: "CHECKPOINT_INVALID",
          error: "Execution integrity validation failed for plan_checkpoint.",
          state: expect.objectContaining({
            planId: plan.id,
            activeLock: expect.objectContaining({
              lockReleasedAt: null,
            }),
          }),
        })
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("does not advance the checkpoint when a step fails", async () => {
    const { executionEngine, executionStateStore, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue({ ok: false, error: "boom", type: "execution_failure" });

    try {
      const result = await executionEngine.execute(makePlan(1), {
        executionMode: "auto_execute",
        controlApproved: true,
        triggerSource: "api",
      });

      expect(result.ok).toBe(false);
      const checkpoint = executionStateStore.loadExecutionCheckpoint("plan_checkpoint");
      expect(checkpoint).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            status: "failed",
            currentStep: 0,
            lastCompletedStepIndex: -1,
          }),
        })
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("halts live execution when attempt completion persistence fails", async () => {
    const { executionEngine, executionIntegrityStore, executionStateStore, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      stateDatabase.withDatabase((db: { exec: (sql: string) => void }) => {
        db.exec(`
          CREATE TRIGGER prevent_attempt_completion
          BEFORE UPDATE OF status ON execution_attempts
          WHEN NEW.status = 'completed'
          BEGIN
            SELECT RAISE(FAIL, 'attempt completion failed');
          END;
        `);
      });

      const result = await executionEngine.execute(makePlan(1), {
        executionMode: "auto_execute",
        controlApproved: true,
        triggerSource: "api",
      });

      expect(result).toEqual(
        expect.objectContaining({
          ok: false,
          code: "DB_WRITE_FAILED",
          error: "attempt completion failed",
          state: expect.objectContaining({
            planId: "plan_checkpoint",
            checkpoint: expect.objectContaining({
              status: "running",
              currentStep: 0,
              lastCompletedStepIndex: -1,
            }),
          }),
        }),
      );

      const checkpoint = executionStateStore.loadExecutionCheckpoint("plan_checkpoint");
      expect(checkpoint).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            status: "running",
            currentStep: 0,
            lastCompletedStepIndex: -1,
          }),
        }),
      );

      const attempts = executionIntegrityStore.listExecutionAttempts("plan_checkpoint");
      expect(attempts).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              stepId: "step_0",
              attemptNumber: 1,
              status: "running",
            }),
          ]),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("halts live execution when attempt failure persistence fails", async () => {
    const { executionEngine, executionIntegrityStore, executionStateStore, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue({ ok: false, error: "boom", type: "execution_failure" });

    try {
      stateDatabase.withDatabase((db: { exec: (sql: string) => void }) => {
        db.exec(`
          CREATE TRIGGER prevent_attempt_failure
          BEFORE UPDATE OF status ON execution_attempts
          WHEN NEW.status = 'failed'
          BEGIN
            SELECT RAISE(FAIL, 'attempt failure write failed');
          END;
        `);
      });

      const result = await executionEngine.execute(makePlan(1), {
        executionMode: "auto_execute",
        controlApproved: true,
        triggerSource: "api",
      });

      expect(result).toEqual(
        expect.objectContaining({
          ok: false,
          code: "DB_WRITE_FAILED",
          error: "attempt failure write failed",
          state: expect.objectContaining({
            planId: "plan_checkpoint",
            checkpoint: expect.objectContaining({
              status: "running",
              currentStep: 0,
              lastCompletedStepIndex: -1,
            }),
          }),
        }),
      );

      const checkpoint = executionStateStore.loadExecutionCheckpoint("plan_checkpoint");
      expect(checkpoint).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            status: "running",
            currentStep: 0,
            lastCompletedStepIndex: -1,
          }),
        }),
      );

      const attempts = executionIntegrityStore.listExecutionAttempts("plan_checkpoint");
      expect(attempts).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              stepId: "step_0",
              attemptNumber: 1,
              status: "running",
            }),
          ]),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("fails terminal execution completion when lock release persistence fails", async () => {
    const { executionEngine, executionIntegrityStore, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      stateDatabase.withDatabase((db: { exec: (sql: string) => void }) => {
        db.exec(`
          CREATE TRIGGER prevent_lock_release_on_execute
          BEFORE UPDATE OF lock_released_at ON execution_locks
          WHEN NEW.lock_released_at IS NOT NULL
          BEGIN
            SELECT RAISE(FAIL, 'lock release failed');
          END;
        `);
      });

      const result = await executionEngine.execute(makePlan(1), {
        executionMode: "auto_execute",
        controlApproved: true,
        triggerSource: "api",
      });

      expect(result).toEqual(
        expect.objectContaining({
          ok: false,
          code: "DB_WRITE_FAILED",
          error: "lock release failed",
          state: expect.objectContaining({
            planId: "plan_checkpoint",
            activeLock: expect.objectContaining({
              lockReleasedAt: null,
            }),
          }),
        }),
      );

      const locks = executionIntegrityStore.listExecutionLocks("plan_checkpoint");
      expect(locks).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              lockReleasedAt: null,
            }),
          ]),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("keeps operator review resume behavior compatible", async () => {
    const { executionEngine, reviewSurface, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const paused = await executionEngine.execute(
        {
          id: "plan_resume_compat",
          type: "multi",
          originalRequest: "rewrite then continue",
          reviewStatus: "approved",
          currentStageExecutable: true,
          finalMode: "auto_execute",
          stages: [
            {
              id: "stage_1",
              name: "Inspect",
              steps: [
                {
                  id: "rewrite_step",
                  action: "read_file",
                  payload: "notes.txt",
                  originalInput: "cat notes.txt",
                  normalizedInput: "Get-Content notes.txt",
                },
                { id: "followup_step", action: "read_file", payload: "summary.txt" },
              ],
            },
          ],
        },
        { executionMode: "auto_execute", controlApproved: true, triggerSource: "api" }
      );

      expect(paused.paused).toBe(true);
      const resumed = await executionEngine.resumeExecution(paused.run.runId, "operator_1", "approve");

      expect(resumed.ok).toBe(true);
      expect(reviewSurface.getReviewSurface(paused.run.runId).pending_reviews).toEqual([]);
      expect(toolRouter.route.mock.calls.map((call: Array<{ id: string }>) => call[0].id)).toEqual([
        "rewrite_step",
        "followup_step",
      ]);
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("refuses operator resume when persisted paused state drifts from orchestration state", async () => {
    const { executionEngine, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const paused = await executionEngine.execute(
        {
          id: "plan_resume_drift",
          type: "multi",
          originalRequest: "rewrite then drift",
          reviewStatus: "approved",
          currentStageExecutable: true,
          finalMode: "auto_execute",
          stages: [
            {
              id: "stage_1",
              name: "Inspect",
              steps: [
                {
                  id: "rewrite_step",
                  action: "read_file",
                  payload: "notes.txt",
                  originalInput: "cat notes.txt",
                  normalizedInput: "Get-Content notes.txt",
                },
                { id: "followup_step", action: "read_file", payload: "summary.txt" },
              ],
            },
          ],
        },
        { executionMode: "auto_execute", controlApproved: true, triggerSource: "api" }
      );

      expect(paused.paused).toBe(true);
      stateDatabase.withDatabase((db: { prepare: (sql: string) => { run: (...args: Array<unknown>) => unknown } }) => {
        db.prepare("UPDATE executions SET status = ? WHERE id = ?").run("completed", paused.run.runId);
        db.prepare("UPDATE execution_stages SET status = ? WHERE execution_id = ?").run("completed", paused.run.runId);
        db.prepare("UPDATE execution_steps SET status = ? WHERE execution_id = ?").run("completed", paused.run.runId);
      });

      const resumed = await executionEngine.resumeExecution(paused.run.runId, "operator_1", "approve");
      expect(resumed).toEqual(
        expect.objectContaining({
          ok: false,
          code: "CORRUPTED",
          state: expect.objectContaining({
            planId: "plan_resume_drift",
            diagnostics: expect.objectContaining({
              summary: expect.any(Object),
            }),
          }),
        }),
      );
      expect(toolRouter.route).not.toHaveBeenCalled();
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("rehydrates paused review resume from persisted execution state when orchestration metadata is stale", async () => {
    const { executionEngine, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const paused = await executionEngine.execute(
        {
          id: "plan_resume_rehydrate",
          type: "multi",
          originalRequest: "rewrite then resume from persisted snapshot",
          reviewStatus: "approved",
          currentStageExecutable: true,
          finalMode: "auto_execute",
          stages: [
            {
              id: "stage_1",
              name: "Inspect",
              steps: [
                {
                  id: "rewrite_step",
                  action: "read_file",
                  payload: "notes.txt",
                  originalInput: "cat notes.txt",
                  normalizedInput: "Get-Content notes.txt",
                },
                { id: "followup_step", action: "read_file", payload: "summary.txt" },
              ],
            },
          ],
        },
        { executionMode: "auto_execute", controlApproved: true, triggerSource: "api" }
      );

      expect(paused.paused).toBe(true);
      const orchestration = stateDatabase.loadDocument("execution-orchestration-state");
      const staleRuns = (orchestration.runs || []).map((run: Record<string, unknown>) => {
        if (String(run.runId) !== String(paused.run.runId)) {
          return run;
        }
        return {
          ...run,
          stages: (Array.isArray(run.stages) ? run.stages : []).map((stage: Record<string, unknown>) => ({
            ...stage,
            status: "pending",
            pauseReason: null,
          })),
          steps: (Array.isArray(run.steps) ? run.steps : []).map((step: Record<string, unknown>) => ({
            ...step,
            status: "pending",
            requiresReview: false,
            pauseReason: null,
          })),
          globalState: "paused",
          reviewStatus: "pending",
        };
      });
      stateDatabase.saveDocument("execution-orchestration-state", {
        ...orchestration,
        runs: staleRuns,
      });

      const resumed = await executionEngine.resumeExecution(paused.run.runId, "operator_1", "approve");
      expect(resumed.ok).toBe(true);
      expect(toolRouter.route.mock.calls.map((call: Array<{ id: string }>) => call[0].id)).toEqual([
        "rewrite_step",
        "followup_step",
      ]);
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("describes execution state when operator resume hits a persisted lock conflict", async () => {
    const { executionEngine, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const paused = await executionEngine.execute(
        {
          id: "plan_resume_lock_conflict",
          type: "multi",
          originalRequest: "rewrite then conflict",
          reviewStatus: "approved",
          currentStageExecutable: true,
          finalMode: "auto_execute",
          stages: [
            {
              id: "stage_1",
              name: "Inspect",
              steps: [
                {
                  id: "rewrite_step",
                  action: "read_file",
                  payload: "notes.txt",
                  originalInput: "cat notes.txt",
                  normalizedInput: "Get-Content notes.txt",
                },
                { id: "followup_step", action: "read_file", payload: "summary.txt" },
              ],
            },
          ],
        },
        { executionMode: "auto_execute", controlApproved: true, triggerSource: "api" }
      );

      expect(paused.paused).toBe(true);
      stateDatabase.withDatabase((db: { prepare: (sql: string) => { run: (...args: Array<unknown>) => unknown } }) => {
        db.prepare("UPDATE execution_locks SET execution_id = ?, worker_id = ?, lock_released_at = NULL WHERE plan_id = ?")
          .run("exec_other", "worker_other", "plan_resume_lock_conflict");
      });

      const resumed = await executionEngine.resumeExecution(paused.run.runId, "operator_1", "approve");

      expect(resumed).toEqual(
        expect.objectContaining({
          ok: false,
          code: "LOCK_CONFLICT",
          state: expect.objectContaining({
            planId: "plan_resume_lock_conflict",
            activeLock: expect.objectContaining({
              executionId: "exec_other",
            }),
            diagnostics: expect.objectContaining({
              activeLock: expect.objectContaining({
                executionId: "exec_other",
              }),
            }),
          }),
        }),
      );
      expect(toolRouter.route).not.toHaveBeenCalled();
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("refuses operator resume while a paused execution still reports a live lease", async () => {
    const { executionEngine, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const paused = await executionEngine.execute(
        {
          id: "plan_resume_live_lease",
          type: "multi",
          originalRequest: "rewrite then retain lease",
          reviewStatus: "approved",
          currentStageExecutable: true,
          finalMode: "auto_execute",
          stages: [
            {
              id: "stage_1",
              name: "Inspect",
              steps: [
                {
                  id: "rewrite_step",
                  action: "read_file",
                  payload: "notes.txt",
                  originalInput: "cat notes.txt",
                  normalizedInput: "Get-Content notes.txt",
                },
                { id: "followup_step", action: "read_file", payload: "summary.txt" },
              ],
            },
          ],
        },
        { executionMode: "auto_execute", controlApproved: true, triggerSource: "api" }
      );

      expect(paused.paused).toBe(true);
      stateDatabase.withDatabase((db: { prepare: (sql: string) => { run: (...args: Array<unknown>) => unknown } }) => {
        db.prepare("UPDATE executions SET lease_owner = ?, lease_expires_at = ? WHERE id = ?")
          .run("worker_live", Date.now() + 60000, paused.run.runId);
      });

      const resumed = await executionEngine.resumeExecution(paused.run.runId, "operator_1", "approve");

      expect(resumed).toEqual(
        expect.objectContaining({
          ok: false,
          code: "EXECUTION_ACTIVE",
          error: "Execution is still leased and cannot be resumed safely yet.",
          state: expect.objectContaining({
            planId: "plan_resume_live_lease",
            checkpoint: expect.objectContaining({
              status: "awaiting_review",
            }),
          }),
        }),
      );
      expect(toolRouter.route).not.toHaveBeenCalled();
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("describes execution state when operator resume is called after review is already resolved", async () => {
    const { executionEngine, reviewSurface, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const paused = await executionEngine.execute(
        {
          id: "plan_resume_not_paused",
          type: "multi",
          originalRequest: "rewrite then resume twice",
          reviewStatus: "approved",
          currentStageExecutable: true,
          finalMode: "auto_execute",
          stages: [
            {
              id: "stage_1",
              name: "Inspect",
              steps: [
                {
                  id: "rewrite_step",
                  action: "read_file",
                  payload: "notes.txt",
                  originalInput: "cat notes.txt",
                  normalizedInput: "Get-Content notes.txt",
                },
                { id: "followup_step", action: "read_file", payload: "summary.txt" },
              ],
            },
          ],
        },
        { executionMode: "auto_execute", controlApproved: true, triggerSource: "api" }
      );

      expect(paused.paused).toBe(true);
      const resumed = await executionEngine.resumeExecution(paused.run.runId, "operator_1", "approve");
      expect(resumed.ok).toBe(true);
      expect(reviewSurface.getReviewSurface(paused.run.runId).pending_reviews).toEqual([]);

      const duplicateResume = await executionEngine.resumeExecution(paused.run.runId, "operator_1", "approve");
      expect(duplicateResume).toEqual(
        expect.objectContaining({
          ok: false,
          error: "Execution plan is not paused for review.",
          state: expect.objectContaining({
            planId: "plan_resume_not_paused",
            checkpoint: expect.objectContaining({
              status: "completed",
            }),
            diagnostics: expect.objectContaining({
              summary: expect.any(Object),
            }),
          }),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("pauses operator resume when no forward progress limit is already exceeded", async () => {
    const { executionEngine, executionIntegrityStore, executionStateStore, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const paused = await executionEngine.execute(
        {
          id: "plan_resume_no_progress_limit",
          type: "multi",
          originalRequest: "rewrite then hit no progress limit",
          reviewStatus: "approved",
          currentStageExecutable: true,
          finalMode: "auto_execute",
          stages: [
            {
              id: "stage_1",
              name: "Inspect",
              steps: [
                {
                  id: "rewrite_step",
                  action: "read_file",
                  payload: "notes.txt",
                  originalInput: "cat notes.txt",
                  normalizedInput: "Get-Content notes.txt",
                },
                { id: "followup_step", action: "read_file", payload: "summary.txt" },
              ],
            },
          ],
        },
        { executionMode: "auto_execute", controlApproved: true, triggerSource: "api" }
      );

      expect(paused.paused).toBe(true);
      stateDatabase.withDatabase((db: { prepare: (sql: string) => { run: (...args: Array<unknown>) => unknown } }) => {
        db.prepare("UPDATE executions SET no_progress_attempts = ? WHERE id = ?").run(3, paused.run.runId);
      });

      const resumed = await executionEngine.resumeExecution(paused.run.runId, "operator_1", "approve");

      expect(resumed).toEqual(
        expect.objectContaining({
          ok: false,
          paused: true,
          requiresReview: true,
          error: "Execution paused because no forward progress was detected.",
        }),
      );
      expect(toolRouter.route).not.toHaveBeenCalled();

      const persisted = executionStateStore.loadExecutionState(paused.run.runId);
      expect(persisted.execution).toEqual(
        expect.objectContaining({
          status: "paused_for_review",
          requiresReview: true,
          noProgressAttempts: 3,
        }),
      );
      const checkpoint = executionStateStore.loadExecutionCheckpoint("plan_resume_no_progress_limit");
      expect(checkpoint).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            status: "awaiting_review",
          }),
        }),
      );
      const locks = executionIntegrityStore.listExecutionLocks("plan_resume_no_progress_limit");
      expect(locks).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              executionId: paused.run.runId,
              lockReleasedAt: expect.any(Number),
            }),
          ]),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("fails operator resume when consecutive failure limit is already exceeded", async () => {
    const { executionEngine, executionIntegrityStore, executionStateStore, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const paused = await executionEngine.execute(
        {
          id: "plan_resume_failure_limit",
          type: "multi",
          originalRequest: "rewrite then hit failure limit",
          reviewStatus: "approved",
          currentStageExecutable: true,
          finalMode: "auto_execute",
          stages: [
            {
              id: "stage_1",
              name: "Inspect",
              steps: [
                {
                  id: "rewrite_step",
                  action: "read_file",
                  payload: "notes.txt",
                  originalInput: "cat notes.txt",
                  normalizedInput: "Get-Content notes.txt",
                },
                { id: "followup_step", action: "read_file", payload: "summary.txt" },
              ],
            },
          ],
        },
        { executionMode: "auto_execute", controlApproved: true, triggerSource: "api" }
      );

      expect(paused.paused).toBe(true);
      stateDatabase.withDatabase((db: { prepare: (sql: string) => { run: (...args: Array<unknown>) => unknown } }) => {
        db.prepare("UPDATE executions SET consecutive_failures = ? WHERE id = ?").run(5, paused.run.runId);
      });

      const resumed = await executionEngine.resumeExecution(paused.run.runId, "operator_1", "approve");

      expect(resumed).toEqual(
        expect.objectContaining({
          ok: false,
          error: "Execution failed after consecutive failure limit was exceeded.",
        }),
      );
      expect(toolRouter.route).not.toHaveBeenCalled();

      const persisted = executionStateStore.loadExecutionState(paused.run.runId);
      expect(persisted.execution).toEqual(
        expect.objectContaining({
          status: "failed",
          consecutiveFailures: 5,
        }),
      );
      const checkpoint = executionStateStore.loadExecutionCheckpoint("plan_resume_failure_limit");
      expect(checkpoint).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            status: "failed",
          }),
        }),
      );
      const locks = executionIntegrityStore.listExecutionLocks("plan_resume_failure_limit");
      expect(locks).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              executionId: paused.run.runId,
              lockReleasedAt: expect.any(Number),
            }),
          ]),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("pauses operator resume when the max attempt limit is already exceeded", async () => {
    const { executionEngine, executionIntegrityStore, executionStateStore, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const paused = await executionEngine.execute(
        {
          id: "plan_resume_max_attempts_failure",
          type: "multi",
          originalRequest: "rewrite then fail at the last allowed attempt",
          reviewStatus: "approved",
          currentStageExecutable: true,
          finalMode: "auto_execute",
          stages: [
            {
              id: "stage_1",
              name: "Inspect",
              steps: [
                {
                  id: "rewrite_step",
                  action: "read_file",
                  payload: "notes.txt",
                  originalInput: "cat notes.txt",
                  normalizedInput: "Get-Content notes.txt",
                },
                { id: "followup_step", action: "read_file", payload: "summary.txt" },
              ],
            },
          ],
        },
        { executionMode: "auto_execute", controlApproved: true, triggerSource: "api" }
      );

      expect(paused.paused).toBe(true);
      stateDatabase.withDatabase((db: { prepare: (sql: string) => { run: (...args: Array<unknown>) => unknown } }) => {
        db.prepare("UPDATE executions SET total_attempts = ? WHERE id = ?").run(50, paused.run.runId);
      });

      const resumed = await executionEngine.resumeExecution(paused.run.runId, "operator_1", "approve");

      expect(resumed).toEqual(
        expect.objectContaining({
          ok: false,
          paused: true,
          requiresReview: true,
          error: "Execution paused because the maximum attempt limit was exceeded.",
        }),
      );
      expect(toolRouter.route).not.toHaveBeenCalled();

      const persisted = executionStateStore.loadExecutionState(paused.run.runId);
      expect(persisted.execution).toEqual(
        expect.objectContaining({
          status: "paused_for_review",
          requiresReview: true,
          totalAttempts: 50,
        }),
      );
      const checkpoint = executionStateStore.loadExecutionCheckpoint("plan_resume_max_attempts_failure");
      expect(checkpoint).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            status: "awaiting_review",
          }),
        }),
      );
      const locks = executionIntegrityStore.listExecutionLocks("plan_resume_max_attempts_failure");
      expect(locks).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              executionId: paused.run.runId,
              lockReleasedAt: expect.any(Number),
            }),
          ]),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("pauses operator resume when the execution duration limit is already exceeded", async () => {
    const { executionEngine, executionIntegrityStore, executionStateStore, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const paused = await executionEngine.execute(
        {
          id: "plan_resume_execution_timeout",
          type: "multi",
          originalRequest: "rewrite then hit execution timeout",
          reviewStatus: "approved",
          currentStageExecutable: true,
          finalMode: "auto_execute",
          stages: [
            {
              id: "stage_1",
              name: "Inspect",
              steps: [
                {
                  id: "rewrite_step",
                  action: "read_file",
                  payload: "notes.txt",
                  originalInput: "cat notes.txt",
                  normalizedInput: "Get-Content notes.txt",
                },
                { id: "followup_step", action: "read_file", payload: "summary.txt" },
              ],
            },
          ],
        },
        { executionMode: "auto_execute", controlApproved: true, triggerSource: "api" }
      );

      expect(paused.paused).toBe(true);
      const oldStartedAt = new Date(Date.now() - (16 * 60 * 1000)).toISOString();
      const freshProgressAt = new Date().toISOString();
      stateDatabase.withDatabase((db: { prepare: (sql: string) => { run: (...args: Array<unknown>) => unknown } }) => {
        db.prepare("UPDATE executions SET started_at = ?, last_progress_at = ? WHERE id = ?")
          .run(oldStartedAt, freshProgressAt, paused.run.runId);
      });

      const resumed = await executionEngine.resumeExecution(paused.run.runId, "operator_1", "approve");

      expect(resumed).toEqual(
        expect.objectContaining({
          ok: false,
          paused: true,
          requiresReview: true,
          error: "Execution paused because the execution timeout was exceeded.",
        }),
      );
      expect(toolRouter.route).not.toHaveBeenCalled();

      const persisted = executionStateStore.loadExecutionState(paused.run.runId);
      expect(persisted.execution).toEqual(
        expect.objectContaining({
          status: "paused_for_review",
          requiresReview: true,
        }),
      );
      const checkpoint = executionStateStore.loadExecutionCheckpoint("plan_resume_execution_timeout");
      expect(checkpoint).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            status: "awaiting_review",
          }),
        }),
      );
      const locks = executionIntegrityStore.listExecutionLocks("plan_resume_execution_timeout");
      expect(locks).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              executionId: paused.run.runId,
              lockReleasedAt: expect.any(Number),
            }),
          ]),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("pauses operator resume when persisted forward progress is stale", async () => {
    const { executionEngine, executionIntegrityStore, executionStateStore, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const paused = await executionEngine.execute(
        {
          id: "plan_resume_stale_progress",
          type: "multi",
          originalRequest: "rewrite then stale progress",
          reviewStatus: "approved",
          currentStageExecutable: true,
          finalMode: "auto_execute",
          stages: [
            {
              id: "stage_1",
              name: "Inspect",
              steps: [
                {
                  id: "rewrite_step",
                  action: "read_file",
                  payload: "notes.txt",
                  originalInput: "cat notes.txt",
                  normalizedInput: "Get-Content notes.txt",
                },
                { id: "followup_step", action: "read_file", payload: "summary.txt" },
              ],
            },
          ],
        },
        { executionMode: "auto_execute", controlApproved: true, triggerSource: "api" }
      );

      expect(paused.paused).toBe(true);
      const freshStartedAt = new Date().toISOString();
      const staleProgressAt = new Date(Date.now() - (3 * 60 * 1000)).toISOString();
      stateDatabase.withDatabase((db: { prepare: (sql: string) => { run: (...args: Array<unknown>) => unknown } }) => {
        db.prepare("UPDATE executions SET started_at = ?, last_progress_at = ? WHERE id = ?")
          .run(freshStartedAt, staleProgressAt, paused.run.runId);
      });

      const resumed = await executionEngine.resumeExecution(paused.run.runId, "operator_1", "approve");

      expect(resumed).toEqual(
        expect.objectContaining({
          ok: false,
          paused: true,
          requiresReview: true,
          error: "Execution paused because no forward progress was detected.",
        }),
      );
      expect(toolRouter.route).not.toHaveBeenCalled();

      const persisted = executionStateStore.loadExecutionState(paused.run.runId);
      expect(persisted.execution).toEqual(
        expect.objectContaining({
          status: "paused_for_review",
          requiresReview: true,
        }),
      );
      const checkpoint = executionStateStore.loadExecutionCheckpoint("plan_resume_stale_progress");
      expect(checkpoint).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            status: "awaiting_review",
          }),
        }),
      );
      const locks = executionIntegrityStore.listExecutionLocks("plan_resume_stale_progress");
      expect(locks).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              executionId: paused.run.runId,
              lockReleasedAt: expect.any(Number),
            }),
          ]),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("fails terminal operator resume completion when lock release persistence fails", async () => {
    const { executionEngine, toolRouter, stateDatabase } = loadRuntime();
    toolRouter.route = vi.fn().mockResolvedValue("ok");

    try {
      const paused = await executionEngine.execute(
        {
          id: "plan_resume_release_fail",
          type: "multi",
          originalRequest: "rewrite then fail on release",
          reviewStatus: "approved",
          currentStageExecutable: true,
          finalMode: "auto_execute",
          stages: [
            {
              id: "stage_1",
              name: "Inspect",
              steps: [
                {
                  id: "rewrite_step",
                  action: "read_file",
                  payload: "notes.txt",
                  originalInput: "cat notes.txt",
                  normalizedInput: "Get-Content notes.txt",
                },
                { id: "followup_step", action: "read_file", payload: "summary.txt" },
              ],
            },
          ],
        },
        { executionMode: "auto_execute", controlApproved: true, triggerSource: "api" }
      );

      expect(paused.paused).toBe(true);
      stateDatabase.withDatabase((db: { exec: (sql: string) => void }) => {
        db.exec(`
          CREATE TRIGGER prevent_lock_release_on_resume
          BEFORE UPDATE OF lock_released_at ON execution_locks
          WHEN NEW.lock_released_at IS NOT NULL
          BEGIN
            SELECT RAISE(FAIL, 'lock release failed');
          END;
        `);
      });

      const resumed = await executionEngine.resumeExecution(paused.run.runId, "operator_1", "approve");
      expect(resumed).toEqual(
        expect.objectContaining({
          ok: false,
          code: "DB_WRITE_FAILED",
          error: "lock release failed",
          state: expect.objectContaining({
            planId: "plan_resume_release_fail",
            activeLock: expect.objectContaining({
              lockReleasedAt: null,
            }),
          }),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });
});

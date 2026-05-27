import { beforeEach, describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const runtimePathsPath = require.resolve("../../services/runtimePaths.js");
const stateDatabasePath = require.resolve("../../services/stateDatabase.js");
const executionStateStorePath = require.resolve("../../services/executionStateStore.js");
const executionIntegrityStorePath = require.resolve("../../services/executionIntegrityStore.js");
const lifecycleAttemptAtomicPath = require.resolve("../../services/lifecycleAttemptAtomic.js");
const reviewSurfacePath = require.resolve("../../services/reviewSurface.js");
const transactionPath = require.resolve("../../services/transaction.js");

function loadRuntime() {
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
  for (const modulePath of [
    lifecycleAttemptAtomicPath,
    executionIntegrityStorePath,
    reviewSurfacePath,
    executionStateStorePath,
    transactionPath,
    stateDatabasePath,
    runtimePathsPath,
  ]) {
    delete require.cache[modulePath];
  }

  const stateDatabase = require("../../services/stateDatabase.js");
  const executionStateStore = require("../../services/executionStateStore.js");
  const executionIntegrityStore = require("../../services/executionIntegrityStore.js");
  const lifecycleAttemptAtomic = require("../../services/lifecycleAttemptAtomic.js");
  const reviewSurface = require("../../services/reviewSurface.js");

  executionStateStore.clearExecutionStateForTests();

  return {
    stateDatabase,
    executionStateStore,
    executionIntegrityStore,
    lifecycleAttemptAtomic,
    reviewSurface,
  };
}

function seedRunningExecution(executionStateStore, planId, executionId) {
  expect(executionStateStore.startExecutionState({ id: planId, steps: [] })).toEqual(
    expect.objectContaining({ ok: true })
  );

  executionStateStore.persistExecutionSnapshot({
    runId: executionId,
    planId,
    triggerSource: "system",
    globalState: "running",
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
    stages: [
      {
        id: "stage_1",
        sequence: 1,
        status: "running",
        name: "Stage 1",
      },
    ],
    steps: [
      {
        id: "step_1",
        stageId: "stage_1",
        sequence: 1,
        status: "pending",
        actionClass: "read",
        description: "Read state",
      },
    ],
  });
}

beforeEach(() => {
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
});

describe("atomic lifecycle attempt boundaries", () => {
  it("atomically starts an attempt, marks the checkpoint running, and updates the snapshot", () => {
    const { stateDatabase, executionStateStore, executionIntegrityStore, lifecycleAttemptAtomic } = loadRuntime();

    try {
      seedRunningExecution(executionStateStore, "plan_attempt_atomic", "exec_attempt_atomic");

      const started = lifecycleAttemptAtomic.beginExecutionAttemptAtomic({
        planId: "plan_attempt_atomic",
        executionId: "exec_attempt_atomic",
        stepId: "step_1",
        stepIndex: 0,
        sideEffectClass: "pure_read",
      });

      expect(started).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            checkpoint: expect.objectContaining({
              status: "running",
              currentStep: 0,
            }),
            attempt: expect.objectContaining({
              stepId: "step_1",
              attemptNumber: 1,
              status: "running",
            }),
          }),
        })
      );

      const checkpoint = executionStateStore.loadExecutionCheckpoint("plan_attempt_atomic");
      expect(checkpoint).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            status: "running",
            currentStep: 0,
            lastCompletedStepIndex: -1,
          }),
        })
      );

      const snapshot = executionStateStore.loadExecutionState("exec_attempt_atomic");
      expect(snapshot.execution.status).toBe("running");
      expect(snapshot.steps[0]?.status).toBe("running");

      const attempts = executionIntegrityStore.listExecutionAttempts("plan_attempt_atomic", "exec_attempt_atomic");
      expect(attempts).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              stepId: "step_1",
              attemptNumber: 1,
              status: "running",
            }),
          ]),
        })
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("rolls back checkpoint and snapshot changes when attempt completion persistence fails", () => {
    const { stateDatabase, executionStateStore, executionIntegrityStore, lifecycleAttemptAtomic } = loadRuntime();

    try {
      seedRunningExecution(executionStateStore, "plan_attempt_rollback", "exec_attempt_rollback");
      const started = lifecycleAttemptAtomic.beginExecutionAttemptAtomic({
        planId: "plan_attempt_rollback",
        executionId: "exec_attempt_rollback",
        stepId: "step_1",
        stepIndex: 0,
        sideEffectClass: "pure_read",
      });
      expect(started.ok).toBe(true);

      stateDatabase.withDatabase((db) => {
        db.exec(`
          CREATE TRIGGER prevent_attempt_completion_atomic
          BEFORE UPDATE OF status ON execution_attempts
          WHEN NEW.status = 'completed'
          BEGIN
            SELECT RAISE(FAIL, 'attempt completion failed');
          END;
        `);
      });

      const completed = lifecycleAttemptAtomic.completeExecutionAttemptAtomic({
        planId: "plan_attempt_rollback",
        executionId: "exec_attempt_rollback",
        stepId: "step_1",
        stepIndex: 0,
        totalSteps: 1,
        attemptNumber: 1,
        resultPayload: { ok: true },
      });

      expect(completed).toEqual(
        expect.objectContaining({
          ok: false,
          code: "DB_WRITE_FAILED",
        })
      );

      const checkpoint = executionStateStore.loadExecutionCheckpoint("plan_attempt_rollback");
      expect(checkpoint).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            status: "running",
            currentStep: 0,
            lastCompletedStepIndex: -1,
          }),
        })
      );

      const snapshot = executionStateStore.loadExecutionState("exec_attempt_rollback");
      expect(snapshot.execution.status).toBe("running");
      expect(snapshot.steps[0]?.status).toBe("running");

      const attempts = executionIntegrityStore.listExecutionAttempts("plan_attempt_rollback", "exec_attempt_rollback");
      expect(attempts).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              stepId: "step_1",
              attemptNumber: 1,
              status: "running",
            }),
          ]),
        })
      );

      const ledger = executionIntegrityStore.listLedgerEvents("plan_attempt_rollback", "exec_attempt_rollback");
      expect(ledger).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.not.arrayContaining([
            expect.objectContaining({
              eventType: "attempt.completed",
            }),
          ]),
        })
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("atomically fails an attempt and moves the checkpoint and snapshot to failed", () => {
    const { stateDatabase, executionStateStore, executionIntegrityStore, lifecycleAttemptAtomic } = loadRuntime();

    try {
      seedRunningExecution(executionStateStore, "plan_attempt_failed", "exec_attempt_failed");
      const started = lifecycleAttemptAtomic.beginExecutionAttemptAtomic({
        planId: "plan_attempt_failed",
        executionId: "exec_attempt_failed",
        stepId: "step_1",
        stepIndex: 0,
        sideEffectClass: "pure_read",
      });
      expect(started.ok).toBe(true);

      const failed = lifecycleAttemptAtomic.failExecutionAttemptAtomic({
        planId: "plan_attempt_failed",
        executionId: "exec_attempt_failed",
        stepId: "step_1",
        stepIndex: 0,
        attemptNumber: 1,
        errorPayload: { error: "boom", type: "execution_failure" },
      });

      expect(failed).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            attempt: expect.objectContaining({
              status: "failed",
            }),
            checkpoint: expect.objectContaining({
              status: "failed",
              currentStep: 0,
            }),
          }),
        })
      );

      const checkpoint = executionStateStore.loadExecutionCheckpoint("plan_attempt_failed");
      expect(checkpoint).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            status: "failed",
            currentStep: 0,
          }),
        })
      );

      const snapshot = executionStateStore.loadExecutionState("exec_attempt_failed");
      expect(snapshot.execution.status).toBe("running");
      expect(snapshot.steps[0]?.status).toBe("failed");

      const ledger = executionIntegrityStore.listLedgerEvents("plan_attempt_failed", "exec_attempt_failed");
      expect(ledger).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              eventType: "attempt.failed",
              stepId: "step_1",
            }),
          ]),
        })
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("atomically pauses an attempt for review and keeps the review boundary coherent", () => {
    const { stateDatabase, executionStateStore, executionIntegrityStore, lifecycleAttemptAtomic } = loadRuntime();

    try {
      seedRunningExecution(executionStateStore, "plan_attempt_review", "exec_attempt_review");
      expect(executionIntegrityStore.acquireExecutionLock("plan_attempt_review", "exec_attempt_review")).toEqual(
        expect.objectContaining({ ok: true })
      );
      const started = lifecycleAttemptAtomic.beginExecutionAttemptAtomic({
        planId: "plan_attempt_review",
        executionId: "exec_attempt_review",
        stepId: "step_1",
        stepIndex: 0,
        sideEffectClass: "pure_read",
      });
      expect(started.ok).toBe(true);

      const paused = lifecycleAttemptAtomic.pauseExecutionAttemptForReviewAtomic({
        planId: "plan_attempt_review",
        executionId: "exec_attempt_review",
        stepId: "step_1",
        stepIndex: 0,
        attemptNumber: 1,
        reason: "step_requested_review",
      });

      expect(paused).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            attempt: expect.objectContaining({
              status: "cancelled",
            }),
            checkpoint: expect.objectContaining({
              status: "awaiting_review",
              currentStep: 0,
            }),
            lockReleasedAt: expect.any(Number),
          }),
        })
      );

      const checkpoint = executionStateStore.loadExecutionCheckpoint("plan_attempt_review");
      expect(checkpoint).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            status: "awaiting_review",
            currentStep: 0,
          }),
        })
      );

      const snapshot = executionStateStore.loadExecutionState("exec_attempt_review");
      expect(snapshot.execution.status).toBe("running");
      expect(snapshot.steps[0]?.status).toBe("paused_for_review");
      expect(snapshot.steps[0]?.pauseReason).toBe("step_requested_review");

      const ledger = executionIntegrityStore.listLedgerEvents("plan_attempt_review", "exec_attempt_review");
      expect(ledger).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              eventType: "attempt.cancelled",
              stepId: "step_1",
            }),
          ]),
        })
      );

      const locks = executionIntegrityStore.listExecutionLocks("plan_attempt_review");
      expect(locks).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              executionId: "exec_attempt_review",
              lockReleasedAt: expect.any(Number),
            }),
          ]),
        })
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("atomically pauses before execution for review and persists review metadata", () => {
    const { stateDatabase, executionStateStore, executionIntegrityStore, lifecycleAttemptAtomic, reviewSurface } = loadRuntime();

    try {
      seedRunningExecution(executionStateStore, "plan_pre_review", "exec_pre_review");
      expect(executionIntegrityStore.acquireExecutionLock("plan_pre_review", "exec_pre_review")).toEqual(
        expect.objectContaining({ ok: true })
      );

      const pausedRun = {
        runId: "exec_pre_review",
        planId: "plan_pre_review",
        triggerSource: "system",
        globalState: "paused",
        reviewStatus: "pending",
        createdAt: "2026-05-01T00:00:00.000Z",
        updatedAt: "2026-05-01T00:00:10.000Z",
        stages: [
          {
            id: "stage_1",
            sequence: 1,
            status: "paused_for_review",
            name: "Stage 1",
            pauseReason: "normalized_input_changed",
          },
        ],
        steps: [
          {
            id: "step_1",
            stageId: "stage_1",
            sequence: 1,
            status: "paused_for_review",
            actionClass: "read",
            description: "Read state",
            pauseReason: "normalized_input_changed",
            originalInput: "a",
            normalizedInput: "A",
          },
        ],
      };
      const reviewRecord = reviewSurface.createReviewRecord("exec_pre_review", pausedRun.steps, "safe_execute", {
        status: "pending",
        reasonFlagged: "normalized_input_changed",
        currentStage: { id: "stage_1", name: "Stage 1", status: "paused_for_review" },
      });

      const paused = lifecycleAttemptAtomic.pauseBeforeExecutionForReviewAtomic({
        planId: "plan_pre_review",
        executionId: "exec_pre_review",
        stepId: "step_1",
        stageId: "stage_1",
        stepIndex: 0,
        reason: "normalized_input_changed",
        runSnapshot: pausedRun,
        reviewRecord,
      });

      expect(paused).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            checkpoint: expect.objectContaining({
              status: "awaiting_review",
              currentStep: 0,
            }),
            lockReleasedAt: expect.any(Number),
          }),
        })
      );

      const checkpoint = executionStateStore.loadExecutionCheckpoint("plan_pre_review");
      expect(checkpoint).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            status: "awaiting_review",
            currentStep: 0,
          }),
        })
      );

      const snapshot = executionStateStore.loadExecutionState("exec_pre_review");
      expect(snapshot.steps[0]?.status).toBe("paused_for_review");
      expect(snapshot.pendingReviews.length).toBeGreaterThan(0);
      expect(snapshot.auditTimeline).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ eventType: "stage.paused_for_review" }),
          expect.objectContaining({ eventType: "review.requested" }),
          expect.objectContaining({ eventType: "execution.paused" }),
        ])
      );

      const ledger = executionIntegrityStore.listLedgerEvents("plan_pre_review", "exec_pre_review");
      expect(ledger).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({ eventType: "stage.paused_for_review" }),
            expect.objectContaining({ eventType: "review.requested" }),
            expect.objectContaining({ eventType: "execution.paused" }),
          ]),
        })
      );

      const locks = executionIntegrityStore.listExecutionLocks("plan_pre_review");
      expect(locks).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              executionId: "exec_pre_review",
              lockReleasedAt: expect.any(Number),
            }),
          ]),
        })
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });
});

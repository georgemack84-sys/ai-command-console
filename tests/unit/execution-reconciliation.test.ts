import { beforeEach, describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const stateDatabasePath = require.resolve("../../services/stateDatabase.js");
const runtimePathsPath = require.resolve("../../services/runtimePaths.js");
const executionIntegrityStorePath = require.resolve("../../services/executionIntegrityStore.js");
const executionStateStorePath = require.resolve("../../services/executionStateStore.js");
const executionReconciliationPath = require.resolve("../../services/executionReconciliation.js");

function loadRuntime() {
  vi.doUnmock("../../services/executionIntegrityStore.js");
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
  for (const modulePath of [
    executionReconciliationPath,
    executionIntegrityStorePath,
    executionStateStorePath,
    stateDatabasePath,
    runtimePathsPath,
  ]) {
    delete require.cache[modulePath];
  }

  const stateDatabase = require("../../services/stateDatabase.js");
  const executionStateStore = require("../../services/executionStateStore.js");
  const executionIntegrityStore = require("../../services/executionIntegrityStore.js");
  const executionReconciliation = require("../../services/executionReconciliation.js");

  executionStateStore.clearExecutionStateForTests();

  return {
    stateDatabase,
    executionStateStore,
    executionIntegrityStore,
    executionReconciliation,
  };
}

function makePlan(overrides: Record<string, unknown> = {}) {
  return {
    id: "plan_reconcile",
    version: 1,
    steps: [
      {
        id: "step_0",
        action: "write_file",
        metadata: {
          idempotent: false,
          retryStrategy: "manual_only",
          sideEffectClass: "external_write",
        },
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
});

describe("execution reconciliation", () => {
  it("detects corruption and marks the checkpoint corrupted", () => {
    const {
      stateDatabase,
      executionStateStore,
      executionIntegrityStore,
      executionReconciliation,
    } = loadRuntime();

    try {
      const plan = makePlan();
      executionStateStore.startExecutionState(plan);
      executionStateStore.checkpointBeforeStep(plan.id, 0);
      executionIntegrityStore.acquireExecutionLock(plan.id, "exec_corrupt");
      executionIntegrityStore.createExecutionAttempt({
        planId: plan.id,
        executionId: "exec_corrupt",
        stepId: "step_0",
        sideEffectClass: "external_write",
      });
      stateDatabase.withDatabase((db: { prepare: (sql: string) => { run: (...args: Array<unknown>) => unknown } }) =>
        db.prepare("UPDATE execution_attempts SET idempotency_key = NULL WHERE plan_id = ? AND execution_id = ?").run(
          plan.id,
          "exec_corrupt",
        ),
      );

      const validated = executionReconciliation.validateExecutionIntegrity(plan.id, plan);
      expect(validated).toEqual(
        expect.objectContaining({
          ok: false,
          code: "CORRUPTED",
          diagnostics: expect.objectContaining({
            planId: plan.id,
            summary: expect.objectContaining({
              executionIds: expect.arrayContaining(["exec_corrupt"]),
              active: expect.objectContaining({
                ledger: expect.any(Object),
              }),
            }),
          }),
        }),
      );

      const checkpoint = executionStateStore.loadExecutionCheckpoint(plan.id);
      expect(checkpoint).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            status: "corrupted",
          }),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("explains execution corruption with a reusable diagnostics payload", () => {
    const {
      stateDatabase,
      executionStateStore,
      executionIntegrityStore,
      executionReconciliation,
    } = loadRuntime();

    try {
      const plan = makePlan();
      executionStateStore.startExecutionState(plan);
      executionStateStore.checkpointBeforeStep(plan.id, 0);
      executionIntegrityStore.acquireExecutionLock(plan.id, "exec_explain");
      executionIntegrityStore.createExecutionAttempt({
        planId: plan.id,
        executionId: "exec_explain",
        stepId: "step_0",
        sideEffectClass: "external_write",
      });
      stateDatabase.withDatabase((db: { prepare: (sql: string) => { run: (...args: Array<unknown>) => unknown } }) =>
        db.prepare("UPDATE execution_attempts SET idempotency_key = NULL WHERE plan_id = ? AND execution_id = ?").run(
          plan.id,
          "exec_explain",
        ),
      );

      const explained = executionReconciliation.explainExecutionCorruption(plan.id, plan);
      expect(explained).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            planId: plan.id,
            corrupted: true,
            issues: expect.arrayContaining([
              expect.objectContaining({
                code: "IDEMPOTENCY_MISMATCH",
              }),
            ]),
            diagnostics: expect.objectContaining({
              summary: expect.objectContaining({
                executionIds: expect.arrayContaining(["exec_explain"]),
              }),
            }),
          }),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("detects a completed checkpoint without a matching execution.completed ledger entry", () => {
    const {
      stateDatabase,
      executionStateStore,
      executionIntegrityStore,
      executionReconciliation,
    } = loadRuntime();

    try {
      const plan = makePlan({
        steps: [
          {
            id: "step_0",
            action: "read_file",
            metadata: {
              idempotent: true,
              retryStrategy: "safe",
              sideEffectClass: "pure_read",
            },
          },
        ],
      });

      executionStateStore.startExecutionState(plan);
      executionIntegrityStore.acquireExecutionLock(plan.id, "exec_missing_complete");
      executionIntegrityStore.appendLedgerEvent({
        planId: plan.id,
        executionId: "exec_missing_complete",
        eventType: "execution.created",
        payload: { status: "pending" },
      });
      executionIntegrityStore.appendLedgerEvent({
        planId: plan.id,
        executionId: "exec_missing_complete",
        eventType: "execution.started",
        payload: { status: "running" },
      });
      executionIntegrityStore.createExecutionAttempt({
        planId: plan.id,
        executionId: "exec_missing_complete",
        stepId: "step_0",
        sideEffectClass: "pure_read",
      });
      executionIntegrityStore.completeExecutionAttempt(plan.id, "exec_missing_complete", "step_0", 1, { ok: true });
      executionStateStore.checkpointAfterStep(plan.id, 0, 1);
      executionIntegrityStore.releaseExecutionLock(plan.id, "exec_missing_complete");

      const validated = executionReconciliation.validateExecutionIntegrity(plan.id, plan);
      expect(validated).toEqual(
        expect.objectContaining({
          ok: false,
          code: "CORRUPTED",
          issues: expect.arrayContaining([
            expect.objectContaining({
              code: "LEDGER_MISSING",
            }),
          ]),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("detects stage terminal ledger entries without a prior stage start", () => {
    const {
      stateDatabase,
      executionStateStore,
      executionIntegrityStore,
      executionReconciliation,
    } = loadRuntime();

    try {
      const plan = makePlan();
      executionStateStore.startExecutionState(plan);
      executionIntegrityStore.acquireExecutionLock(plan.id, "exec_bad_stage");
      executionIntegrityStore.appendLedgerEvent({
        planId: plan.id,
        executionId: "exec_bad_stage",
        eventType: "execution.created",
        payload: { status: "pending" },
      });
      executionIntegrityStore.appendLedgerEvent({
        planId: plan.id,
        executionId: "exec_bad_stage",
        eventType: "execution.started",
        payload: { status: "running" },
      });
      executionIntegrityStore.appendLedgerEvent({
        planId: plan.id,
        executionId: "exec_bad_stage",
        eventType: "stage.completed",
        payload: { stageId: "stage_1", status: "completed" },
      });

      const validated = executionReconciliation.validateExecutionIntegrity(plan.id, plan);
      expect(validated).toEqual(
        expect.objectContaining({
          ok: false,
          code: "CORRUPTED",
          issues: expect.arrayContaining([
            expect.objectContaining({
              code: "LEDGER_INVALID",
            }),
          ]),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("detects checkpoint and execution snapshot status drift", () => {
    const {
      stateDatabase,
      executionStateStore,
      executionReconciliation,
    } = loadRuntime();

    try {
      const plan = makePlan({
        steps: [
          {
            id: "step_0",
            action: "read_file",
            metadata: {
              idempotent: true,
              retryStrategy: "safe",
              sideEffectClass: "pure_read",
            },
          },
        ],
      });

      executionStateStore.startExecutionState(plan);
      executionStateStore.persistExecutionSnapshot({
        runId: "exec_snapshot_drift",
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
            payload: "notes.txt",
            reviewAcknowledged: true,
          },
        ],
        stages: [
          {
            id: "stage_1",
            sequence: 1,
            name: "Default Stage",
            status: "completed",
          },
        ],
      });

      const validated = executionReconciliation.validateExecutionIntegrity(plan.id, plan);
      expect(validated).toEqual(
        expect.objectContaining({
          ok: false,
          code: "CORRUPTED",
          issues: expect.arrayContaining([
            expect.objectContaining({
              code: "SNAPSHOT_MISMATCH",
            }),
          ]),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("detects execution snapshot step shape drift from the plan", () => {
    const {
      stateDatabase,
      executionStateStore,
      executionReconciliation,
    } = loadRuntime();

    try {
      const plan = makePlan({
        steps: [
          {
            id: "step_0",
            action: "read_file",
            metadata: {
              idempotent: true,
              retryStrategy: "safe",
              sideEffectClass: "pure_read",
            },
          },
          {
            id: "step_1",
            action: "read_file",
            metadata: {
              idempotent: true,
              retryStrategy: "safe",
              sideEffectClass: "pure_read",
            },
          },
        ],
      });

      executionStateStore.startExecutionState(plan);
      executionStateStore.persistExecutionSnapshot({
        runId: "exec_shape_drift",
        planId: plan.id,
        globalState: "running",
        reviewStatus: "approved",
        steps: [
          {
            id: "step_0",
            sequence: 1,
            stageId: "stage_1",
            status: "pending",
            action: "read_file",
            payload: "notes.txt",
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

      const validated = executionReconciliation.validateExecutionIntegrity(plan.id, plan);
      expect(validated).toEqual(
        expect.objectContaining({
          ok: false,
          code: "CORRUPTED",
          issues: expect.arrayContaining([
            expect.objectContaining({
              code: "SNAPSHOT_MISMATCH",
            }),
          ]),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("detects completed stages that still contain pending steps in the execution snapshot", () => {
    const {
      stateDatabase,
      executionStateStore,
      executionReconciliation,
    } = loadRuntime();

    try {
      const plan = makePlan();
      executionStateStore.startExecutionState(plan);
      executionStateStore.persistExecutionSnapshot({
        runId: "exec_stage_shape_drift",
        planId: plan.id,
        globalState: "running",
        reviewStatus: "approved",
        steps: [
          {
            id: "step_0",
            sequence: 1,
            stageId: "stage_1",
            status: "pending",
            action: "read_file",
            payload: "notes.txt",
          },
        ],
        stages: [
          {
            id: "stage_1",
            sequence: 1,
            name: "Default Stage",
            status: "completed",
          },
        ],
      });

      const validated = executionReconciliation.validateExecutionIntegrity(plan.id, plan);
      expect(validated).toEqual(
        expect.objectContaining({
          ok: false,
          code: "CORRUPTED",
          issues: expect.arrayContaining([
            expect.objectContaining({
              code: "SNAPSHOT_MISMATCH",
            }),
          ]),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("queues operator recovery for unsafe expired attempts", () => {
    const {
      stateDatabase,
      executionStateStore,
      executionIntegrityStore,
      executionReconciliation,
    } = loadRuntime();

    try {
      const plan = makePlan({
        steps: [
          {
            id: "step_0",
            action: "delete_file",
            metadata: {
              idempotent: false,
              retryStrategy: "manual_only",
              sideEffectClass: "destructive",
            },
          },
        ],
      });

      executionStateStore.startExecutionState(plan);
      executionStateStore.checkpointBeforeStep(plan.id, 0);
      executionIntegrityStore.acquireExecutionLock(plan.id, "exec_destructive");
      executionIntegrityStore.createExecutionAttempt({
        planId: plan.id,
        executionId: "exec_destructive",
        stepId: "step_0",
        sideEffectClass: "destructive",
      });

      stateDatabase.withDatabase((db: { prepare: (sql: string) => { run: (...args: Array<unknown>) => unknown } }) =>
        db.prepare("UPDATE execution_attempts SET lease_expires_at = 0 WHERE plan_id = ?").run(plan.id),
      );

      const reconciled = executionReconciliation.reconcileExecutionState(plan);
      expect(reconciled).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            action: "operator_recovery",
          }),
        }),
      );

      const checkpoint = executionStateStore.loadExecutionCheckpoint(plan.id);
      expect(checkpoint).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            status: "pause_for_operator_recovery",
          }),
        }),
      );

      const recoveryQueue = executionIntegrityStore.listRecoveryQueue(plan.id);
      expect(recoveryQueue).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              planId: plan.id,
              stepId: "step_0",
              reason: "recovery_ambiguous",
            }),
          ]),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("abandons executions when operator recovery items expire", () => {
    const {
      stateDatabase,
      executionStateStore,
      executionIntegrityStore,
      executionReconciliation,
    } = loadRuntime();

    try {
      const plan = makePlan({
        steps: [
          {
            id: "step_0",
            action: "network_call",
            metadata: {
              idempotent: false,
              retryStrategy: "manual_only",
              sideEffectClass: "unknown",
            },
          },
        ],
      });

      executionStateStore.startExecutionState(plan);
      executionStateStore.setExecutionCheckpointStatus(plan.id, "pause_for_operator_recovery");
      executionIntegrityStore.acquireExecutionLock(plan.id, "exec_abandon");
      executionIntegrityStore.enqueueOperatorRecovery({
        planId: plan.id,
        executionId: "exec_abandon",
        stepId: "step_0",
        reason: "unsafe_recovery_unknown",
        lastState: "running",
        safeOptions: ["inspect", "cancel"],
        recommended: "inspect",
        ttlMs: 10,
      });

      stateDatabase.withDatabase((db: { prepare: (sql: string) => { run: (...args: Array<unknown>) => unknown } }) =>
        db.prepare("UPDATE execution_recovery_queue SET expires_at_ms = 0 WHERE plan_id = ?").run(plan.id),
      );

      const reconciled = executionReconciliation.reconcileExecutionState(plan);
      expect(reconciled).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            action: "abandon",
          }),
        }),
      );

      const checkpoint = executionStateStore.loadExecutionCheckpoint(plan.id);
      expect(checkpoint).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            status: "execution_abandoned",
          }),
        }),
      );

      const locks = executionIntegrityStore.listExecutionLocks(plan.id);
      expect(locks).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              planId: plan.id,
              lockReleasedAt: expect.any(Number),
            }),
          ]),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("replays the immutable ledger as a read-only execution timeline", () => {
    const {
      stateDatabase,
      executionStateStore,
      executionIntegrityStore,
      executionReconciliation,
    } = loadRuntime();

    try {
      const plan = makePlan({
        steps: [
          {
            id: "step_0",
            action: "read_file",
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
      executionIntegrityStore.acquireExecutionLock(plan.id, "exec_replay");
      executionIntegrityStore.appendLedgerEvent({
        planId: plan.id,
        executionId: "exec_replay",
        eventType: "execution.created",
        payload: { status: "pending" },
      });
      executionIntegrityStore.appendLedgerEvent({
        planId: plan.id,
        executionId: "exec_replay",
        eventType: "execution.started",
        payload: { status: "running" },
      });
      executionIntegrityStore.createExecutionAttempt({
        planId: plan.id,
        executionId: "exec_replay",
        stepId: "step_0",
        sideEffectClass: "pure_read",
      });
      executionIntegrityStore.completeExecutionAttempt(plan.id, "exec_replay", "step_0", 1, {
        ok: true,
      });
      executionStateStore.persistExecutionSnapshot({
        runId: "exec_replay",
        planId: plan.id,
        globalState: "idle",
        reviewStatus: "approved",
        steps: [
          {
            id: "step_0",
            sequence: 1,
            stageId: "stage_1",
            status: "completed",
            action: "read_file",
            payload: "notes.txt",
            reviewAcknowledged: true,
          },
        ],
        stages: [
          {
            id: "stage_1",
            sequence: 1,
            name: "Default Stage",
            status: "completed",
          },
        ],
      });
      executionStateStore.checkpointAfterStep(plan.id, 0, 1);
      executionIntegrityStore.appendLedgerEvent({
        planId: plan.id,
        executionId: "exec_replay",
        eventType: "execution.completed",
        payload: { status: "completed" },
      });
      executionIntegrityStore.releaseExecutionLock(plan.id, "exec_replay");

      const replay = executionReconciliation.replayExecution(plan.id);
      expect(replay).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            planId: plan.id,
            timeline: expect.arrayContaining([
              expect.objectContaining({ eventType: "attempt.started", stepId: "step_0", attemptNumber: 1 }),
              expect.objectContaining({ eventType: "attempt.completed", stepId: "step_0", attemptNumber: 1 }),
            ]),
            summary: expect.objectContaining({
              executionIds: expect.arrayContaining(["exec_replay"]),
              terminalEventType: "execution.completed",
              stepCount: 1,
              active: expect.objectContaining({
                checkpoint: expect.objectContaining({
                  status: "completed",
                  currentStepIndex: 1,
                }),
                snapshot: expect.any(Object),
                ledger: expect.objectContaining({
                  stepId: "step_0",
                }),
              }),
              snapshot: expect.objectContaining({
                executionId: "exec_replay",
                status: "completed",
                completedStepCount: 1,
              }),
            }),
            snapshot: expect.objectContaining({
              execution: expect.objectContaining({
                id: "exec_replay",
                planId: plan.id,
                status: "completed",
              }),
              steps: expect.arrayContaining([
                expect.objectContaining({
                  id: "step_0",
                  status: "completed",
                }),
              ]),
            }),
          }),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("cancellation overrides retry when a leased step has expired", () => {
    const {
      stateDatabase,
      executionStateStore,
      executionIntegrityStore,
      executionReconciliation,
    } = loadRuntime();

    try {
      const plan = makePlan({
        steps: [
          {
            id: "step_0",
            action: "read_file",
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
      executionStateStore.requestExecutionCancellation(plan.id);
      executionIntegrityStore.acquireExecutionLock(plan.id, "exec_cancel");
      executionIntegrityStore.createExecutionAttempt({
        planId: plan.id,
        executionId: "exec_cancel",
        stepId: "step_0",
        sideEffectClass: "pure_read",
      });

      stateDatabase.withDatabase((db: { prepare: (sql: string) => { run: (...args: Array<unknown>) => unknown } }) =>
        db.prepare("UPDATE execution_attempts SET lease_expires_at = 0 WHERE plan_id = ?").run(plan.id),
      );

      const reconciled = executionReconciliation.reconcileExecutionState(plan);
      expect(reconciled).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            action: "cancelled",
          }),
        }),
      );

      const checkpoint = executionStateStore.loadExecutionCheckpoint(plan.id);
      expect(checkpoint).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            status: "cancelled",
            cancellationRequested: true,
          }),
        }),
      );

      const attempts = executionIntegrityStore.listExecutionAttempts(plan.id, "exec_cancel", "step_0");
      expect(attempts).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              status: "cancelled",
              attemptNumber: 1,
            }),
          ]),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("abandons execution when max attempts are exceeded", () => {
    const {
      stateDatabase,
      executionStateStore,
      executionIntegrityStore,
      executionReconciliation,
    } = loadRuntime();

    try {
      const plan = makePlan({
        steps: [
          {
            id: "step_0",
            action: "read_file",
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
      executionIntegrityStore.acquireExecutionLock(plan.id, "exec_attempts");

      for (let attemptNumber = 1; attemptNumber <= 50; attemptNumber += 1) {
        executionIntegrityStore.createExecutionAttempt({
          planId: plan.id,
          executionId: "exec_attempts",
          stepId: "step_0",
          sideEffectClass: "pure_read",
        });
        executionIntegrityStore.failExecutionAttempt(plan.id, "exec_attempts", "step_0", attemptNumber, {
          error: "boom",
          type: "execution_failure",
        });
      }

      const reconciled = executionReconciliation.reconcileExecutionState(plan);
      expect(reconciled).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            action: "abandon",
          }),
        }),
      );

      const checkpoint = executionStateStore.loadExecutionCheckpoint(plan.id);
      expect(checkpoint).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            status: "execution_abandoned",
          }),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("rolls back abandonment when lock release fails inside the terminal transition", () => {
    const {
      stateDatabase,
      executionStateStore,
      executionIntegrityStore,
      executionReconciliation,
    } = loadRuntime();

    try {
      const plan = makePlan({
        steps: [
          {
            id: "step_0",
            action: "read_file",
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
      executionIntegrityStore.acquireExecutionLock(plan.id, "exec_atomic_fail");

      for (let attemptNumber = 1; attemptNumber <= 50; attemptNumber += 1) {
        executionIntegrityStore.createExecutionAttempt({
          planId: plan.id,
          executionId: "exec_atomic_fail",
          stepId: "step_0",
          sideEffectClass: "pure_read",
        });
        executionIntegrityStore.failExecutionAttempt(plan.id, "exec_atomic_fail", "step_0", attemptNumber, {
          error: "boom",
          type: "execution_failure",
        });
      }
      stateDatabase.withDatabase((db: { exec: (sql: string) => void }) => {
        db.exec(`
          CREATE TRIGGER prevent_execution_lock_release
          BEFORE UPDATE OF lock_released_at ON execution_locks
          WHEN NEW.lock_released_at IS NOT NULL
          BEGIN
            SELECT RAISE(FAIL, 'lock release failed');
          END;
        `);
      });

      const reconciled = executionReconciliation.reconcileExecutionState(plan);
      expect(reconciled).toEqual(
        expect.objectContaining({
          ok: false,
          code: "DB_WRITE_FAILED",
        }),
      );

      const checkpoint = executionStateStore.loadExecutionCheckpoint(plan.id);
      expect(checkpoint).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            status: "running",
          }),
        }),
      );

      const locks = executionIntegrityStore.listExecutionLocks(plan.id);
      expect(locks).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              executionId: "exec_atomic_fail",
              lockReleasedAt: null,
            }),
          ]),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("queues operator recovery when execution duration exceeds the limit", () => {
    const {
      stateDatabase,
      executionStateStore,
      executionIntegrityStore,
      executionReconciliation,
    } = loadRuntime();

    try {
      const plan = makePlan({
        steps: [
          {
            id: "step_0",
            action: "read_file",
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
      executionIntegrityStore.acquireExecutionLock(plan.id, "exec_duration");
      executionIntegrityStore.createExecutionAttempt({
        planId: plan.id,
        executionId: "exec_duration",
        stepId: "step_0",
        sideEffectClass: "pure_read",
      });

      stateDatabase.withDatabase((db: { prepare: (sql: string) => { run: (...args: Array<unknown>) => unknown } }) =>
        db.prepare("UPDATE execution_attempts SET created_at = 0, updated_at = 0 WHERE plan_id = ?").run(plan.id),
      );

      const reconciled = executionReconciliation.reconcileExecutionState(plan);
      expect(reconciled).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            action: "operator_recovery",
          }),
        }),
      );

      const checkpoint = executionStateStore.loadExecutionCheckpoint(plan.id);
      expect(checkpoint).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            status: "pause_for_operator_recovery",
          }),
        }),
      );

      const recoveryQueue = executionIntegrityStore.listRecoveryQueue(plan.id);
      expect(recoveryQueue).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              reason: "execution_duration_exceeded",
            }),
          ]),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("rolls back operator recovery handoff when lock release fails during duration containment", () => {
    const {
      stateDatabase,
      executionStateStore,
      executionIntegrityStore,
      executionReconciliation,
    } = loadRuntime();

    try {
      const plan = makePlan({
        steps: [
          {
            id: "step_0",
            action: "read_file",
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
      executionIntegrityStore.acquireExecutionLock(plan.id, "exec_duration_atomic_fail");
      executionIntegrityStore.createExecutionAttempt({
        planId: plan.id,
        executionId: "exec_duration_atomic_fail",
        stepId: "step_0",
        sideEffectClass: "pure_read",
      });

      stateDatabase.withDatabase((db: { prepare: (sql: string) => { run: (...args: Array<unknown>) => unknown }, exec: (sql: string) => void }) => {
        db.prepare("UPDATE execution_attempts SET created_at = 0, updated_at = 0 WHERE plan_id = ?").run(plan.id);
        db.exec(`
          CREATE TRIGGER prevent_duration_lock_release
          BEFORE UPDATE OF lock_released_at ON execution_locks
          WHEN NEW.lock_released_at IS NOT NULL
          BEGIN
            SELECT RAISE(FAIL, 'lock release failed');
          END;
        `);
      });

      const reconciled = executionReconciliation.reconcileExecutionState(plan);
      expect(reconciled).toEqual(
        expect.objectContaining({
          ok: false,
          code: "DB_WRITE_FAILED",
        }),
      );

      const checkpoint = executionStateStore.loadExecutionCheckpoint(plan.id);
      expect(checkpoint).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            status: "running",
          }),
        }),
      );

      const recoveryQueue = executionIntegrityStore.listRecoveryQueue(plan.id);
      expect(recoveryQueue).toEqual(
        expect.objectContaining({
          ok: true,
          data: [],
        }),
      );

      const locks = executionIntegrityStore.listExecutionLocks(plan.id);
      expect(locks).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              executionId: "exec_duration_atomic_fail",
              lockReleasedAt: null,
            }),
          ]),
        }),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });
});

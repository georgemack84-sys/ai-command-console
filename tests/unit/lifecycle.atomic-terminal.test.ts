import { beforeEach, describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const runtimePathsPath = require.resolve("../../services/runtimePaths.js");
const stateDatabasePath = require.resolve("../../services/stateDatabase.js");
const executionStateStorePath = require.resolve("../../services/executionStateStore.js");
const executionIntegrityStorePath = require.resolve("../../services/executionIntegrityStore.js");
const lifecycleAtomicPath = require.resolve("../../services/lifecycleAtomic.js");
const transactionPath = require.resolve("../../services/transaction.js");

function loadRuntime() {
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
  for (const modulePath of [
    lifecycleAtomicPath,
    executionIntegrityStorePath,
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
  const lifecycleAtomic = require("../../services/lifecycleAtomic.js");

  executionStateStore.clearExecutionStateForTests();

  return {
    stateDatabase,
    executionStateStore,
    executionIntegrityStore,
    lifecycleAtomic,
  };
}

function seedRunningExecution(executionStateStore, executionIntegrityStore, planId, executionId) {
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
        status: "running",
        actionClass: "read",
        description: "Read state",
      },
    ],
  });

  expect(executionIntegrityStore.acquireExecutionLock(planId, executionId)).toEqual(
    expect.objectContaining({ ok: true })
  );
}

beforeEach(() => {
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
});

describe("atomic lifecycle terminal transition", () => {
  it("atomically finalizes an execution, writes ledger, and releases the lock", () => {
    const { stateDatabase, executionStateStore, executionIntegrityStore, lifecycleAtomic } = loadRuntime();

    try {
      seedRunningExecution(executionStateStore, executionIntegrityStore, "plan_atomic_complete", "exec_atomic_complete");

      const finalized = lifecycleAtomic.finalizeExecution({
        executionId: "exec_atomic_complete",
        finalStatus: "completed",
        ownerId: "operator_1",
      });

      expect(finalized).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            executionId: "exec_atomic_complete",
            planId: "plan_atomic_complete",
            finalStatus: "completed",
          }),
        })
      );

      const checkpoint = executionStateStore.loadExecutionCheckpoint("plan_atomic_complete");
      expect(checkpoint).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            status: "completed",
          }),
        })
      );

      const snapshot = executionStateStore.loadExecutionState("exec_atomic_complete");
      expect(snapshot.execution.status).toBe("completed");

      const ledger = executionIntegrityStore.listLedgerEvents("plan_atomic_complete", "exec_atomic_complete");
      expect(ledger).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({ eventType: "execution.completed" }),
          ]),
        })
      );

      const locks = executionIntegrityStore.listExecutionLocks("plan_atomic_complete");
      expect(locks).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              executionId: "exec_atomic_complete",
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

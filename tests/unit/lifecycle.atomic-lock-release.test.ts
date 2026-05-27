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

describe("atomic lifecycle lock release", () => {
  it("releases the existing lock and allows a fresh acquire after finalization", () => {
    const { stateDatabase, executionStateStore, executionIntegrityStore, lifecycleAtomic } = loadRuntime();

    try {
      seedRunningExecution(executionStateStore, executionIntegrityStore, "plan_atomic_lock", "exec_atomic_lock");

      const finalized = lifecycleAtomic.finalizeExecution({
        executionId: "exec_atomic_lock",
        finalStatus: "failed",
        ownerId: "operator_1",
        error: new Error("boom"),
      });
      expect(finalized.ok).toBe(true);

      const releasedLocks = executionIntegrityStore.listExecutionLocks("plan_atomic_lock");
      expect(releasedLocks).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              executionId: "exec_atomic_lock",
              lockReleasedAt: expect.any(Number),
            }),
          ]),
        })
      );

      const reacquired = executionIntegrityStore.acquireExecutionLock("plan_atomic_lock", "exec_atomic_lock");
      expect(reacquired).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            executionId: "exec_atomic_lock",
          }),
        })
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });
});

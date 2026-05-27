import { beforeEach, describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const runtimePathsPath = require.resolve("../../services/runtimePaths.js");
const stateDatabasePath = require.resolve("../../services/stateDatabase.js");
const transactionPath = require.resolve("../../services/transaction.js");
const executionStateStorePath = require.resolve("../../services/executionStateStore.js");
const executionIntegrityStorePath = require.resolve("../../services/executionIntegrityStore.js");

function loadRuntime() {
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
  for (const modulePath of [
    executionIntegrityStorePath,
    executionStateStorePath,
    transactionPath,
    stateDatabasePath,
    runtimePathsPath,
  ]) {
    delete require.cache[modulePath];
  }

  const stateDatabase = require("../../services/stateDatabase.js");
  const transaction = require("../../services/transaction.js");
  const executionStateStore = require("../../services/executionStateStore.js");
  const executionIntegrityStore = require("../../services/executionIntegrityStore.js");

  executionStateStore.clearExecutionStateForTests();

  return {
    stateDatabase,
    transaction,
    executionStateStore,
    executionIntegrityStore,
  };
}

function createRun(planId, executionId) {
  return {
    runId: executionId,
    planId,
    triggerSource: "system",
    status: "pending",
    steps: [],
    stages: [],
  };
}

beforeEach(() => {
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
});

describe("transaction commit", () => {
  it("commits state, snapshot, and ledger writes together", () => {
    const { stateDatabase, transaction, executionStateStore, executionIntegrityStore } = loadRuntime();

    try {
      transaction.withTransaction((tx) => {
        expect(executionStateStore.startExecutionState({ id: "plan_tx_commit", steps: [] }, tx)).toEqual(
          expect.objectContaining({ ok: true })
        );

        executionStateStore.persistExecutionSnapshot(createRun("plan_tx_commit", "exec_tx_commit"), {}, tx);

        expect(
          executionIntegrityStore.appendLedgerEvent(
            {
              planId: "plan_tx_commit",
              executionId: "exec_tx_commit",
              eventType: "execution.created",
              payload: { status: "pending" },
            },
            tx
          )
        ).toEqual(expect.objectContaining({ ok: true }));
      });

      const checkpoint = executionStateStore.loadExecutionCheckpoint("plan_tx_commit");
      expect(checkpoint).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            planId: "plan_tx_commit",
            status: "pending",
          }),
        })
      );

      const snapshot = executionStateStore.loadExecutionState("exec_tx_commit");
      expect(snapshot.execution.id).toBe("exec_tx_commit");

      const ledger = executionIntegrityStore.listLedgerEvents("plan_tx_commit", "exec_tx_commit");
      expect(ledger).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              eventType: "execution.created",
            }),
          ]),
        })
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });
});

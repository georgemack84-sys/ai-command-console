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

function getCounts(stateDatabase) {
  return stateDatabase.withDatabase((db) => ({
    executionState: Number(db.prepare("SELECT COUNT(*) AS count FROM execution_state").get().count || 0),
    executions: Number(db.prepare("SELECT COUNT(*) AS count FROM executions").get().count || 0),
    executionLedger: Number(db.prepare("SELECT COUNT(*) AS count FROM execution_ledger").get().count || 0),
  }));
}

beforeEach(() => {
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
});

describe("transaction rollback", () => {
  it("rolls back multi-store writes when a later write throws", () => {
    const { stateDatabase, transaction, executionStateStore, executionIntegrityStore } = loadRuntime();

    try {
      const initialCounts = getCounts(stateDatabase);

      expect(() =>
        transaction.withTransaction((tx) => {
          const checkpoint = executionStateStore.startExecutionState({ id: "plan_tx_rollback", steps: [] }, tx);
          expect(checkpoint.ok).toBe(true);

          executionStateStore.persistExecutionSnapshot(createRun("plan_tx_rollback", "exec_tx_rollback"), {}, tx);

          const ledger = executionIntegrityStore.appendLedgerEvent(
            {
              planId: "plan_tx_rollback",
              executionId: "exec_tx_rollback",
              eventType: "execution.created",
              payload: { status: "pending" },
            },
            tx
          );
          expect(ledger.ok).toBe(true);

          throw new Error("ROLLBACK_TEST");
        })
      ).toThrow("ROLLBACK_TEST");

      const finalCounts = getCounts(stateDatabase);
      expect(finalCounts).toEqual(initialCounts);

      const noCheckpoint = executionStateStore.loadExecutionCheckpoint("plan_tx_rollback");
      expect(noCheckpoint).toEqual(expect.objectContaining({ ok: false, code: "NOT_FOUND" }));
    } finally {
      stateDatabase.closeDatabase();
    }
  });
});

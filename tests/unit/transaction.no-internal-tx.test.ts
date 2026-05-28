import { beforeEach, describe, expect, it, vi } from "vitest";
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

beforeEach(() => {
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
});

describe("transaction internal behavior", () => {
  it("does not start nested transactions when a tx is provided", () => {
    const { stateDatabase, transaction, executionStateStore, executionIntegrityStore } = loadRuntime();

    try {
      transaction.withTransaction((tx) => {
        const transactionSpy = vi.spyOn(tx, "transaction");

        expect(executionStateStore.startExecutionState({ id: "plan_tx_not_nested", steps: [] }, tx)).toEqual(
          expect.objectContaining({ ok: true })
        );
        expect(
          executionIntegrityStore.appendLedgerEvent(
            {
              planId: "plan_tx_not_nested",
              executionId: "exec_tx_not_nested",
              eventType: "execution.created",
              payload: { status: "pending" },
            },
            tx
          )
        ).toEqual(expect.objectContaining({ ok: true }));

        expect(transactionSpy).not.toHaveBeenCalled();
      });
    } finally {
      stateDatabase.closeDatabase();
    }
  });
});

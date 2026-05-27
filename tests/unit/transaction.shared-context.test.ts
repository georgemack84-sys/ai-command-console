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

describe("transaction shared context", () => {
  it("uses the provided transaction context across store calls", () => {
    const { stateDatabase, transaction, executionStateStore, executionIntegrityStore } = loadRuntime();

    try {
      let prepareCalls = 0;
      let directPrepareCalls = 0;

      transaction.withTransaction((tx) => {
        const originalPrepare = tx.prepare.bind(tx);
        tx.prepare = (...args) => {
          directPrepareCalls += 1;
          return originalPrepare(...args);
        };
        const proxy = {
          prepare(...args) {
            prepareCalls += 1;
            return originalPrepare(...args);
          },
        };

        expect(executionStateStore.startExecutionState({ id: "plan_tx_shared", steps: [] }, proxy)).toEqual(
          expect.objectContaining({ ok: true })
        );
        executionStateStore.persistExecutionSnapshot(createRun("plan_tx_shared", "exec_tx_shared"), {}, proxy);
        expect(
          executionIntegrityStore.appendLedgerEvent(
            {
              planId: "plan_tx_shared",
              executionId: "exec_tx_shared",
              eventType: "execution.created",
              payload: { status: "pending" },
            },
            proxy
          )
        ).toEqual(expect.objectContaining({ ok: true }));
      });

      expect(prepareCalls).toBeGreaterThan(0);
      expect(directPrepareCalls).toBe(0);

      const checkpoint = executionStateStore.loadExecutionCheckpoint("plan_tx_shared");
      expect(checkpoint.ok).toBe(true);
    } finally {
      stateDatabase.closeDatabase();
    }
  });
});

import { beforeEach, describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const runtimePathsPath = require.resolve("../../services/runtimePaths.js");
const stateDatabasePath = require.resolve("../../services/stateDatabase.js");
const executionStateStorePath = require.resolve("../../services/executionStateStore.js");
const executionIntegrityStorePath = require.resolve("../../services/executionIntegrityStore.js");
const scannerPath = require.resolve("../../services/recoveryCandidateScanner.js");

function loadRuntime() {
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
  for (const modulePath of [
    scannerPath,
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
  const scanner = require("../../services/recoveryCandidateScanner.js");

  executionStateStore.clearExecutionStateForTests();
  return {
    stateDatabase,
    executionStateStore,
    executionIntegrityStore,
    scanner,
  };
}

function makePlan(id = "plan_scanner") {
  return {
    id,
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
}

function seedExecution(executionStateStore: any, executionId: string, planId = "plan_scanner", status = "running") {
  const plan = makePlan(planId);
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
        status: status === "failed" ? "failed" : "pending",
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
  return plan;
}

beforeEach(() => {
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
});

describe("recovery candidate scanner", () => {
  it("is read-only and returns no candidates when no evidence exists", () => {
    const { stateDatabase, executionStateStore, executionIntegrityStore, scanner } = loadRuntime();

    try {
      const plan = seedExecution(executionStateStore, "exec_scanner_ok");
      executionIntegrityStore.acquireExecutionLock(plan.id, "exec_scanner_ok");

      const before = stateDatabase.withDatabase((db: any) => ({
        state: db.prepare("SELECT COUNT(*) AS total FROM execution_state").get().total,
        locks: db.prepare("SELECT COUNT(*) AS total FROM execution_locks").get().total,
        ledger: db.prepare("SELECT COUNT(*) AS total FROM execution_ledger").get().total,
      }));

      const result = scanner.scanRecoveryCandidates({ limit: 10 });
      expect(result).toEqual({
        ok: true,
        data: { candidates: [] },
      });

      const after = stateDatabase.withDatabase((db: any) => ({
        state: db.prepare("SELECT COUNT(*) AS total FROM execution_state").get().total,
        locks: db.prepare("SELECT COUNT(*) AS total FROM execution_locks").get().total,
        ledger: db.prepare("SELECT COUNT(*) AS total FROM execution_ledger").get().total,
      }));
      expect(after).toEqual(before);
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("detects failed and expired-lease recovery candidates deterministically", () => {
    const { stateDatabase, executionStateStore, scanner } = loadRuntime();

    try {
      seedExecution(executionStateStore, "exec_failed", "plan_failed", "failed");
      seedExecution(executionStateStore, "exec_expired", "plan_expired", "running");

      stateDatabase.withDatabase((db: any) => {
        db.prepare("UPDATE executions SET lease_owner = ?, lease_expires_at = ? WHERE id = ?")
          .run("worker_1", Date.now() - 60_000, "exec_expired");
      });

      const result = scanner.scanRecoveryCandidates({ limit: 5 });
      expect(result.ok).toBe(true);
      expect(result.data.candidates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            executionId: "exec_failed",
            signalType: "FAILED_EXECUTION",
          }),
          expect.objectContaining({
            executionId: "exec_expired",
            signalType: "EXPIRED_LEASE",
          }),
        ]),
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });
});

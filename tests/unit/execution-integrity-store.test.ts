import { beforeEach, describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const stateDatabasePath = require.resolve("../../services/stateDatabase.js");
const runtimePathsPath = require.resolve("../../services/runtimePaths.js");
const executionIntegrityStorePath = require.resolve("../../services/executionIntegrityStore.js");
const executionStateStorePath = require.resolve("../../services/executionStateStore.js");

function loadRuntime() {
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
  for (const modulePath of [
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

  executionStateStore.clearExecutionStateForTests();

  return {
    stateDatabase,
    executionStateStore,
    executionIntegrityStore,
  };
}

beforeEach(() => {
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
});

describe("execution integrity store", () => {
  it("acquires and releases one active lock per plan", () => {
    const { stateDatabase, executionIntegrityStore } = loadRuntime();

    try {
      const acquired = executionIntegrityStore.acquireExecutionLock("plan_lock", "exec_a");
      expect(acquired).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            planId: "plan_lock",
            executionId: "exec_a",
            heartbeatAt: expect.any(Number),
            leaseExpiresAt: expect.any(Number),
          }),
        })
      );

      const conflict = executionIntegrityStore.acquireExecutionLock("plan_lock", "exec_b");
      expect(conflict).toEqual(
        expect.objectContaining({
          ok: false,
          code: "LOCK_CONFLICT",
        })
      );

      const released = executionIntegrityStore.releaseExecutionLock("plan_lock", "exec_a");
      expect(released).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            planId: "plan_lock",
            executionId: "exec_a",
          }),
        })
      );

      const reacquired = executionIntegrityStore.acquireExecutionLock("plan_lock", "exec_b");
      expect(reacquired.ok).toBe(true);

      const holderLedger = executionIntegrityStore.listLedgerEvents("plan_lock", "exec_a");
      expect(holderLedger).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({ eventType: "lease.acquired" }),
            expect.objectContaining({ eventType: "lease.released" }),
          ]),
        })
      );

      const contenderLedger = executionIntegrityStore.listLedgerEvents("plan_lock", "exec_b");
      expect(contenderLedger).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({ eventType: "lease.conflict" }),
          ]),
        })
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("renews active locks and extends lease state", () => {
    const { stateDatabase, executionIntegrityStore } = loadRuntime();

    try {
      const acquired = executionIntegrityStore.acquireExecutionLock("plan_renew", "exec_1");
      expect(acquired.ok).toBe(true);

      stateDatabase.withDatabase((db: { prepare: (sql: string) => { run: (...args: Array<unknown>) => unknown } }) =>
        db.prepare("UPDATE execution_locks SET lease_expires_at = 0, heartbeat_at = 0 WHERE plan_id = ?").run("plan_renew")
      );

      const renewed = executionIntegrityStore.renewExecutionLock("plan_renew", "exec_1");
      expect(renewed).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            planId: "plan_renew",
            executionId: "exec_1",
            heartbeatAt: expect.any(Number),
            leaseExpiresAt: expect.any(Number),
          }),
        })
      );
      expect(renewed.data.leaseExpiresAt).toBeGreaterThan(0);

      const activeLock = executionIntegrityStore.getActiveExecutionLock("plan_renew");
      expect(activeLock).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            executionId: "exec_1",
            heartbeatAt: expect.any(Number),
            leaseExpiresAt: expect.any(Number),
          }),
        })
      );

      const ledger = executionIntegrityStore.listLedgerEvents("plan_renew", "exec_1");
      expect(ledger).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({ eventType: "lease.renewed" }),
          ]),
        })
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("creates attempts with monotonic numbers and ledger entries", () => {
    const { stateDatabase, executionIntegrityStore } = loadRuntime();

    try {
      const first = executionIntegrityStore.createExecutionAttempt({
        planId: "plan_attempt",
        executionId: "exec_1",
        stepId: "step_a",
        sideEffectClass: "external_write",
        idempotencyKey: "plan_attempt:exec_1:step_a:1",
      });
      const second = executionIntegrityStore.createExecutionAttempt({
        planId: "plan_attempt",
        executionId: "exec_1",
        stepId: "step_a",
        sideEffectClass: "external_write",
        idempotencyKey: "plan_attempt:exec_1:step_a:2",
      });

      expect(first).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            attemptNumber: 1,
            status: "running",
          }),
        })
      );
      expect(second).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            attemptNumber: 2,
            status: "running",
          }),
        })
      );

      const ledger = executionIntegrityStore.listLedgerEvents("plan_attempt", "exec_1");
      expect(ledger).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({ eventType: "attempt.started", attemptNumber: 1 }),
            expect.objectContaining({ eventType: "attempt.started", attemptNumber: 2 }),
          ]),
        })
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("refreshes heartbeat and lease expiry for running attempts", () => {
    const { stateDatabase, executionIntegrityStore } = loadRuntime();

    try {
      const acquired = executionIntegrityStore.acquireExecutionLock("plan_heartbeat", "exec_1");
      expect(acquired.ok).toBe(true);

      const created = executionIntegrityStore.createExecutionAttempt({
        planId: "plan_heartbeat",
        executionId: "exec_1",
        stepId: "step_a",
      });
      const initialLease = created.data.leaseExpiresAt;

      const heartbeat = executionIntegrityStore.heartbeatExecutionAttempt(
        "plan_heartbeat",
        "exec_1",
        "step_a",
        1,
      );

      expect(heartbeat).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            attemptNumber: 1,
            leaseExpiresAt: expect.any(Number),
          }),
        })
      );
      expect(heartbeat.data.leaseExpiresAt).toBeGreaterThanOrEqual(initialLease);

      const activeLock = executionIntegrityStore.getActiveExecutionLock("plan_heartbeat");
      expect(activeLock).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            executionId: "exec_1",
            leaseExpiresAt: expect.any(Number),
          }),
        })
      );
      expect(activeLock.data.leaseExpiresAt).toBeGreaterThan(0);
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("stores operator recovery items and expires them deterministically", () => {
    const { stateDatabase, executionIntegrityStore } = loadRuntime();

    try {
      const queued = executionIntegrityStore.enqueueOperatorRecovery({
        planId: "plan_recovery",
        executionId: "exec_1",
        stepId: "step_external",
        reason: "unsafe_replay",
        lastState: "running",
        safeOptions: ["cancel", "inspect"],
        recommended: "inspect",
        ttlMs: 1,
      });

      expect(queued).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            planId: "plan_recovery",
            reason: "unsafe_replay",
          }),
        })
      );

      stateDatabase.withDatabase((db: { prepare: (sql: string) => { run: (...args: Array<unknown>) => unknown } }) =>
        db.prepare("UPDATE execution_recovery_queue SET expires_at_ms = 0 WHERE plan_id = ?").run("plan_recovery")
      );

      const expired = executionIntegrityStore.expireOperatorRecoveryItems("plan_recovery");
      expect(expired).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.any(Array),
        })
      );

      const queue = executionIntegrityStore.listRecoveryQueue("plan_recovery");
      expect(queue).toEqual(
        expect.objectContaining({
          ok: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              planId: "plan_recovery",
              resolvedAt: expect.any(Number),
            }),
          ]),
        })
      );
    } finally {
      stateDatabase.closeDatabase();
    }
  });

  it("keeps the execution ledger immutable after commit", () => {
    const { stateDatabase, executionIntegrityStore } = loadRuntime();

    try {
      const appended = executionIntegrityStore.appendLedgerEvent({
        planId: "plan_ledger",
        executionId: "exec_1",
        eventType: "execution.created",
        payload: { status: "pending" },
      });
      expect(appended.ok).toBe(true);

      expect(() =>
        stateDatabase.withDatabase((db: { prepare: (sql: string) => { run: (...args: Array<unknown>) => unknown } }) =>
          db.prepare("UPDATE execution_ledger SET event_type = ? WHERE plan_id = ?").run("tampered", "plan_ledger")
        )
      ).toThrow(/immutable/i);

      expect(() =>
        stateDatabase.withDatabase((db: { prepare: (sql: string) => { run: (...args: Array<unknown>) => unknown } }) =>
          db.prepare("DELETE FROM execution_ledger WHERE plan_id = ?").run("plan_ledger")
        )
      ).toThrow(/immutable/i);
    } finally {
      stateDatabase.closeDatabase();
    }
  });
});

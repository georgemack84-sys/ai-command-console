import { beforeEach, describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const require = createRequire(import.meta.url);
const stateDatabasePath = require.resolve("../../services/stateDatabase.js");
const executionIntegrityStorePath = require.resolve("../../services/executionIntegrityStore.js");

function loadRuntime(databasePath = ":memory:") {
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = databasePath;
  for (const modulePath of [executionIntegrityStorePath, stateDatabasePath]) {
    delete require.cache[modulePath];
  }
  const stateDatabase = require("../../services/stateDatabase.js");
  const executionIntegrityStore = require("../../services/executionIntegrityStore.js");
  return { stateDatabase, executionIntegrityStore };
}

beforeEach(() => {
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
});

describe("tenant persistence security", () => {
  it("keeps persisted lock ownership tenant-scoped across reloads", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "ai-command-console-security-"));
    const databasePath = join(tempDir, "agents.db");
    const first = loadRuntime(databasePath);
    try {
      const acquired = first.executionIntegrityStore.acquireExecutionLock(
        "plan-1",
        "exec-1",
        null,
        { tenantId: "tenant-1", workspaceId: "workspace-1" },
      );
      expect(acquired.ok).toBe(true);
    } finally {
      first.stateDatabase.closeDatabase();
    }

    const second = loadRuntime(databasePath);
    try {
      const scoped = second.executionIntegrityStore.listExecutionLocks(null, { tenantId: "tenant-1" });
      expect(scoped.ok).toBe(true);
      expect(scoped.data).toHaveLength(1);
      expect(scoped.data[0].tenantId).toBe("tenant-1");

      const foreign = second.executionIntegrityStore.listExecutionLocks(null, { tenantId: "tenant-2" });
      expect(foreign.ok).toBe(true);
      expect(foreign.data).toHaveLength(0);
    } finally {
      second.stateDatabase.closeDatabase();
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("allows same executionId in different tenants without collision", () => {
    const { stateDatabase, executionIntegrityStore } = loadRuntime();
    try {
      const first = executionIntegrityStore.createExecutionAttempt({
        planId: "plan-a",
        executionId: "exec-shared",
        stepId: "step-1",
        tenantId: "tenant-a",
        workspaceId: "workspace-a",
      });
      const second = executionIntegrityStore.createExecutionAttempt({
        planId: "plan-b",
        executionId: "exec-shared",
        stepId: "step-1",
        tenantId: "tenant-b",
        workspaceId: "workspace-b",
      });

      expect(first.ok).toBe(true);
      expect(second.ok).toBe(true);
      expect(first.data.tenantId).toBe("tenant-a");
      expect(second.data.tenantId).toBe("tenant-b");
    } finally {
      stateDatabase.closeDatabase();
    }
  });
});

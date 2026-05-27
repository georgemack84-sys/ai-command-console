import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import type { TenantContext } from "@/services/tenancy/tenantTypes";
import { createBackupSnapshot } from "@/services/continuity/snapshotCoordinator";
import { createRuntimeContinuitySnapshot } from "@/services/runtime/continuitySnapshot";

const require = createRequire(import.meta.url);
const stateDatabasePath = require.resolve("../../services/stateDatabase.js");

function loadStateDatabase(databasePath: string) {
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = databasePath;
  delete require.cache[stateDatabasePath];
  return require("../../services/stateDatabase.js");
}

const tenantContext: TenantContext = {
  tenantId: "tenant-a",
  workspaceId: "workspace-a",
  source: "test",
  isolationVersion: "3.6G",
};

describe("continuity snapshot", () => {
  let tempDir: string;
  let databasePath: string;
  let dataRoot: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "ai-command-console-continuity-"));
    databasePath = join(tempDir, "console.sqlite");
    dataRoot = join(tempDir, "data");
    process.env.AI_COMMAND_CONSOLE_DATA_ROOT = dataRoot;
    process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = databasePath;
  });

  afterEach(() => {
    delete process.env.AI_COMMAND_CONSOLE_DATA_ROOT;
    delete process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH;
    const stateDatabase = loadStateDatabase(databasePath);
    stateDatabase.closeDatabase();
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  function seedExecutionState() {
    const stateDatabase = loadStateDatabase(databasePath);
    stateDatabase.runInTransaction((db: any) => {
      db.prepare(`
        INSERT INTO executions (
          id, tenant_id, workspace_id, plan_id, status, trigger_source, requires_review,
          created_at, last_updated_at, total_attempts, consecutive_failures, no_progress_attempts
        ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, 0, 0, 0)
      `).run(
        "exec-1",
        tenantContext.tenantId,
        tenantContext.workspaceId,
        "plan-1",
        "failed",
        "api",
        "2026-05-07T00:00:00.000Z",
        "2026-05-07T00:00:00.000Z",
      );

      db.prepare(`
        INSERT INTO execution_attempts (
          plan_id, execution_id, step_id, attempt_number, status, side_effect_class,
          created_at, updated_at, tenant_id, workspace_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        "plan-1",
        "exec-1",
        "step-1",
        1,
        "failed",
        "unknown",
        1,
        1,
        tenantContext.tenantId,
        tenantContext.workspaceId,
      );

      db.prepare(`
        INSERT INTO execution_ledger (
          event_version, plan_id, execution_id, step_id, attempt_number, event_type, event_payload, created_at,
          tenant_id, workspace_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        1,
        "plan-1",
        "exec-1",
        "step-1",
        1,
        "execution.failed",
        JSON.stringify({ reason: "boom" }),
        1,
        tenantContext.tenantId,
        tenantContext.workspaceId,
      );

      db.prepare(`
        INSERT INTO audit_events (
          id, execution_id, step_id, event_type, event_payload, created_at, tenant_id, workspace_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        "audit-1",
        "exec-1",
        "step-1",
        "execution.failed",
        JSON.stringify({ reason: "boom" }),
        "2026-05-07T00:00:00.000Z",
        tenantContext.tenantId,
        tenantContext.workspaceId,
      );
    });
    stateDatabase.closeDatabase();
  }

  it("produces deterministic snapshots for identical state", async () => {
    seedExecutionState();

    const first = await createBackupSnapshot({
      tenantContext,
      generatedAt: "2026-05-07T00:00:00.000Z",
      persist: false,
    });
    const second = await createBackupSnapshot({
      tenantContext,
      generatedAt: "2026-05-07T00:00:00.000Z",
      persist: false,
    });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(first.data.manifest.snapshotHash).toBe(second.data.manifest.snapshotHash);
    expect(first.data.snapshot.executionState.executions).toHaveLength(1);
  });

  it("filters out foreign tenant records", async () => {
    seedExecutionState();
    const foreignDatabase = loadStateDatabase(databasePath);
    foreignDatabase.runInTransaction((db: any) => {
      db.prepare(`
        INSERT INTO executions (
          id, tenant_id, workspace_id, plan_id, status, trigger_source, requires_review,
          created_at, last_updated_at, total_attempts, consecutive_failures, no_progress_attempts
        ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, 0, 0, 0)
      `).run(
        "exec-foreign",
        "tenant-b",
        "workspace-b",
        "plan-2",
        "failed",
        "api",
        "2026-05-07T00:00:00.000Z",
        "2026-05-07T00:00:00.000Z",
      );
    });
    foreignDatabase.closeDatabase();

    const snapshot = await createBackupSnapshot({
      tenantContext,
      generatedAt: "2026-05-07T00:00:00.000Z",
      persist: false,
    });

    expect(snapshot.ok).toBe(true);
    expect(snapshot.data.snapshot.executionState.executions.map((entry) => entry.id)).toEqual(["exec-1"]);
  });

  it("creates deterministic runtime continuity snapshots from telemetry", () => {
    const first = createRuntimeContinuitySnapshot({
      tenantContext,
      generatedAt: "2026-05-07T00:00:00.000Z",
      persist: false,
      telemetry: {
        tenantId: tenantContext.tenantId,
        workspaceId: tenantContext.workspaceId,
        activeExecutions: 1,
        staleLocks: 0,
        activeLocks: 1,
        recoveryBacklog: 0,
        recoveryInProgress: false,
        replayDivergenceDetected: false,
        workerAvailabilityScore: 1,
        dependencyStabilityScore: 1,
        degradedDependencies: [],
        startupReady: true,
        startupSummary: "ready",
        criticalFailures: 0,
        disputedFailures: 0,
        degradedSubsystems: 0,
        timestamp: "2026-05-07T00:00:00.000Z",
      },
    });
    const second = createRuntimeContinuitySnapshot({
      tenantContext,
      generatedAt: "2026-05-07T00:00:00.000Z",
      persist: false,
      telemetry: {
        tenantId: tenantContext.tenantId,
        workspaceId: tenantContext.workspaceId,
        activeExecutions: 1,
        staleLocks: 0,
        activeLocks: 1,
        recoveryBacklog: 0,
        recoveryInProgress: false,
        replayDivergenceDetected: false,
        workerAvailabilityScore: 1,
        dependencyStabilityScore: 1,
        degradedDependencies: [],
        startupReady: true,
        startupSummary: "ready",
        criticalFailures: 0,
        disputedFailures: 0,
        degradedSubsystems: 0,
        timestamp: "2026-05-07T00:00:00.000Z",
      },
    });

    expect(first.snapshotId).toBe(second.snapshotId);
    expect(first.runtimeState).toBe("HEALTHY");
  });
});

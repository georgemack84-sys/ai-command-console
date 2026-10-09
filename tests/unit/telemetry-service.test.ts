import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const originalEnv = { ...process.env };
const telemetryPath = require.resolve("../../services/telemetry.js");
const stateDatabasePath = require.resolve("../../services/stateDatabase.js");
const runtimePathsPath = require.resolve("../../services/runtimePaths.js");

describe("operational telemetry service", () => {
  let tempRoot: string;
  let telemetry: typeof import("../../services/telemetry.js");
  let stateDatabase: { closeDatabase: () => void };

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ai-command-console-telemetry-"));
    process.env = { ...originalEnv, AI_COMMAND_CONSOLE_DATA_ROOT: tempRoot };
    [telemetryPath, stateDatabasePath, runtimePathsPath].forEach((modulePath) => delete require.cache[modulePath]);
    telemetry = require("../../services/telemetry.js");
    stateDatabase = require("../../services/stateDatabase.js");
  });

  afterEach(() => {
    stateDatabase.closeDatabase();
    [telemetryPath, stateDatabasePath, runtimePathsPath].forEach((modulePath) => delete require.cache[modulePath]);
    process.env = { ...originalEnv };
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it("persists stable telemetry dimensions and summarizes domain latency", () => {
    telemetry.recordTelemetry({
      type: "command",
      category: "terminal",
      operation: "alerts:list",
      status: "ok",
      durationMs: 12,
      actorId: "operator_1",
      workspaceId: "workspace_1",
    });
    telemetry.recordTelemetry({
      type: "watcher:evaluate",
      category: "watcher",
      operation: "evaluate",
      status: "ok",
      durationMs: 24,
    });
    telemetry.recordTelemetry({
      type: "approval:decision",
      category: "approval",
      operation: "watcher:stop",
      status: "approved",
      durationMs: 36,
      actorId: "approver_1",
      workspaceId: "workspace_1",
      environment: "production",
      correlationId: "approval_1",
    });

    const summary = telemetry.buildTelemetrySummary();
    expect(summary.totals).toEqual(
      expect.objectContaining({
        events: 3,
        approvals: 1,
        avgCommandLatencyMs: 12,
        avgWatcherLatencyMs: 24,
        avgApprovalLatencyMs: 36,
      }),
    );
    expect(summary.recent[0]).toEqual(
      expect.objectContaining({
        category: "approval",
        operation: "watcher:stop",
        workspaceId: "workspace_1",
        environment: "production",
        correlationId: "approval_1",
      }),
    );
  });
});

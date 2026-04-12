import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const originalEnv = { ...process.env };

const watcherPath = require.resolve("../../services/watcher.js");
const taskQueuePath = require.resolve("../../services/taskQueue.js");
const schedulerPath = require.resolve("../../services/scheduler.js");
const telemetryPath = require.resolve("../../services/telemetry.js");
const stateDatabasePath = require.resolve("../../services/stateDatabase.js");
const runtimePathsPath = require.resolve("../../services/runtimePaths.js");

function createTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "ai-command-console-watcher-"));
}

function loadWatcherWithMocks(tempRoot: string, options?: {
  listTasks?: () => Array<Record<string, unknown>>;
  getSchedule?: (agentName: string) => unknown;
  startSchedule?: (agentName: string, intervalSeconds: number, maxCycles: number) => unknown;
  recordTelemetry?: (payload: unknown) => void;
}) {
  process.env = { ...originalEnv, AI_COMMAND_CONSOLE_DATA_ROOT: tempRoot };

  const originalWatcher = require.cache[watcherPath];
  const originalTaskQueue = require.cache[taskQueuePath];
  const originalScheduler = require.cache[schedulerPath];
  const originalTelemetry = require.cache[telemetryPath];

  require.cache[taskQueuePath] = {
    id: taskQueuePath,
    filename: taskQueuePath,
    loaded: true,
    exports: {
      listTasks: options?.listTasks || (() => []),
    },
  };
  require.cache[schedulerPath] = {
    id: schedulerPath,
    filename: schedulerPath,
    loaded: true,
    exports: {
      getSchedule: options?.getSchedule || (() => null),
      startSchedule: options?.startSchedule || ((agentName: string, intervalSeconds: number, maxCycles: number) => ({
        agentName,
        enabled: true,
        intervalSeconds,
        maxCycles,
        cycleCount: 0,
      })),
    },
  };
  require.cache[telemetryPath] = {
    id: telemetryPath,
    filename: telemetryPath,
    loaded: true,
    exports: {
      recordTelemetry: options?.recordTelemetry || (() => {}),
    },
  };

  delete require.cache[watcherPath];
  delete require.cache[stateDatabasePath];
  delete require.cache[runtimePathsPath];

  const watcher = require("../../services/watcher.js");
  const stateDatabase = require("../../services/stateDatabase.js");

  return {
    watcher,
    stateDatabase,
    restore() {
      watcher.stopWatcher?.("test_cleanup");
      stateDatabase.closeDatabase();
      delete require.cache[watcherPath];
      delete require.cache[stateDatabasePath];
      delete require.cache[runtimePathsPath];

      if (originalWatcher) require.cache[watcherPath] = originalWatcher;
      else delete require.cache[watcherPath];
      if (originalTaskQueue) require.cache[taskQueuePath] = originalTaskQueue;
      else delete require.cache[taskQueuePath];
      if (originalScheduler) require.cache[schedulerPath] = originalScheduler;
      else delete require.cache[schedulerPath];
      if (originalTelemetry) require.cache[telemetryPath] = originalTelemetry;
      else delete require.cache[telemetryPath];
    },
  };
}

describe("watcher service", () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = createTempRoot();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env = { ...originalEnv };
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it("starts schedules for matching queue rules and records telemetry", () => {
    const startSchedule = vi.fn((agentName: string, intervalSeconds: number, maxCycles: number) => ({
      agentName,
      enabled: true,
      intervalSeconds,
      maxCycles,
      cycleCount: 0,
    }));
    const recordTelemetry = vi.fn();
    const { watcher, restore } = loadWatcherWithMocks(tempRoot, {
      listTasks: () => [
        { agentName: "researcher", status: "queued" },
        { agentName: "researcher", status: "queued" },
      ],
      getSchedule: () => null,
      startSchedule,
      recordTelemetry,
    });

    try {
      watcher.saveWatcherState({
        enabled: true,
        intervalSeconds: 4,
        rules: [
          {
            name: "research_queue_rule",
            agentName: "researcher",
            minQueuedTasks: 2,
            scheduleIntervalSeconds: 6,
            scheduleMaxCycles: 4,
            enabled: true,
          },
        ],
        history: [],
      });

      const result = watcher.evaluateRules();

      expect(result.ok).toBe(true);
      expect(result.decisions).toEqual([
        expect.objectContaining({
          ruleName: "research_queue_rule",
          matched: true,
          action: "schedule_started",
        }),
      ]);
      expect(startSchedule).toHaveBeenCalledWith("researcher", 6, 4);
      expect(recordTelemetry).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "watcher:evaluate",
          status: "ok",
          meta: expect.objectContaining({
            matchedRules: 1,
            startedSchedules: 1,
          }),
        }),
      );
    } finally {
      restore();
    }
  });

  it("does not start a new schedule when an enabled schedule is still valid", () => {
    const startSchedule = vi.fn();
    const { watcher, restore } = loadWatcherWithMocks(tempRoot, {
      listTasks: () => [{ agentName: "planner", status: "queued" }],
      getSchedule: () => ({
        enabled: true,
        cycleCount: 1,
        maxCycles: 3,
      }),
      startSchedule,
    });

    try {
      watcher.saveWatcherState({
        enabled: true,
        intervalSeconds: 5,
        rules: [
          {
            name: "planner_queue_rule",
            agentName: "planner",
            minQueuedTasks: 1,
            scheduleIntervalSeconds: 3,
            scheduleMaxCycles: 3,
            enabled: true,
          },
        ],
        history: [],
      });

      const result = watcher.evaluateRules();

      expect(result.decisions).toEqual([
        expect.objectContaining({
          matched: true,
          action: "schedule_already_active_or_valid",
        }),
      ]);
      expect(startSchedule).not.toHaveBeenCalled();
    } finally {
      restore();
    }
  });

  it("normalizes watcher state and trims history to the latest 100 events", () => {
    const { watcher, restore } = loadWatcherWithMocks(tempRoot);

    try {
      const saved = watcher.saveWatcherState({
        enabled: true,
        intervalSeconds: -4,
        rules: "invalid",
        history: Array.from({ length: 105 }, (_, index) => ({ index })),
      });

      expect(saved.intervalSeconds).toBe(1);
      expect(saved.rules).toEqual([]);
      expect(saved.history).toHaveLength(100);
      expect(saved.history[0]).toEqual({ index: 5 });
    } finally {
      restore();
    }
  });

  it("captures interval errors into watcher state and telemetry", () => {
    const recordTelemetry = vi.fn();
    const { watcher, restore } = loadWatcherWithMocks(tempRoot, {
      listTasks: () => [{ agentName: "researcher", status: "queued" }],
      getSchedule: () => null,
      startSchedule: () => {
        throw new Error("scheduler unavailable");
      },
      recordTelemetry,
    });

    try {
      watcher.saveWatcherState({
        enabled: true,
        intervalSeconds: 2,
        rules: [
          {
            name: "researcher_queue_rule",
            agentName: "researcher",
            minQueuedTasks: 1,
            scheduleIntervalSeconds: 3,
            scheduleMaxCycles: 3,
            enabled: true,
          },
        ],
        history: [],
      });

      watcher.startWatcher(2);
      vi.advanceTimersByTime(2000);

      const state = watcher.getWatcherStatus();
      expect(state.lastError).toBe("scheduler unavailable");
      expect(state.history.at(-1)).toEqual(
        expect.objectContaining({
          type: "watcher_error",
          error: "scheduler unavailable",
        }),
      );
      expect(recordTelemetry).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "watcher:evaluate",
          status: "error",
          meta: expect.objectContaining({
            error: "scheduler unavailable",
          }),
        }),
      );
    } finally {
      restore();
    }
  });
});

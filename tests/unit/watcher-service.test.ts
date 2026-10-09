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
const runtimeControlPath = require.resolve("../../services/runtimeControl.js");
const telemetryPath = require.resolve("../../services/telemetry.js");
const stateDatabasePath = require.resolve("../../services/stateDatabase.js");
const runtimePathsPath = require.resolve("../../services/runtimePaths.js");

function createTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "ai-command-console-watcher-"));
}

function loadWatcherWithMocks(tempRoot: string, options?: {
  listTasks?: () => Array<Record<string, unknown>>;
  getSchedule?: (agentName: string) => unknown;
  executeControlledStructuredPlan?: (plan: Record<string, unknown>, options: Record<string, unknown>) => Promise<Record<string, unknown>>;
  recordTelemetry?: (payload: unknown) => void;
}) {
  process.env = { ...originalEnv, AI_COMMAND_CONSOLE_DATA_ROOT: tempRoot };

  const originalWatcher = require.cache[watcherPath];
  const originalTaskQueue = require.cache[taskQueuePath];
  const originalScheduler = require.cache[schedulerPath];
  const originalRuntimeControl = require.cache[runtimeControlPath];
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
    },
  };
  require.cache[runtimeControlPath] = {
    id: runtimeControlPath,
    filename: runtimeControlPath,
    loaded: true,
    exports: {
      executeControlledStructuredPlan:
        options?.executeControlledStructuredPlan ||
        (async (plan: Record<string, unknown>) => {
          const payload = plan.payload as { intervalSeconds?: number; maxCycles?: number };
          return {
            ok: true,
            result: {
              ok: true,
              schedule: {
                enabled: true,
                intervalSeconds: payload.intervalSeconds,
                maxCycles: payload.maxCycles,
                cycleCount: 0,
              },
            },
          };
        }),
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
      if (originalRuntimeControl) require.cache[runtimeControlPath] = originalRuntimeControl;
      else delete require.cache[runtimeControlPath];
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

  it("starts schedules for matching queue rules through governed system execution", async () => {
    const executeControlledStructuredPlan = vi.fn(async (plan: Record<string, unknown>) => ({
      ok: true,
      result: {
        ok: true,
        schedule: {
          enabled: true,
          intervalSeconds: (plan.payload as { intervalSeconds: number }).intervalSeconds,
          maxCycles: (plan.payload as { maxCycles: number }).maxCycles,
          cycleCount: 0,
        },
      },
    }));
    const recordTelemetry = vi.fn();
    const { watcher, restore } = loadWatcherWithMocks(tempRoot, {
      listTasks: () => [
        { agentName: "researcher", status: "queued" },
        { agentName: "researcher", status: "queued" },
      ],
      getSchedule: () => null,
      executeControlledStructuredPlan,
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

      const result = await watcher.evaluateRules();

      expect(result.ok).toBe(true);
      expect(result.decisions).toEqual([
        expect.objectContaining({
          ruleName: "research_queue_rule",
          matched: true,
          action: "schedule_started",
        }),
      ]);
      expect(executeControlledStructuredPlan).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "watcher:schedule-start",
          source: "watcher",
          payload: expect.objectContaining({
            ruleName: "research_queue_rule",
            agentName: "researcher",
            intervalSeconds: 6,
            maxCycles: 4,
          }),
          meta: expect.objectContaining({
            userId: "system:watcher",
            workspaceId: "legacy-global",
            userRole: "system",
          }),
        }),
        expect.objectContaining({
          actor: expect.objectContaining({ id: "system:watcher", role: "system" }),
          identitySource: "system",
          modes: { confirmed: true },
        }),
      );
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

  it("does not start a new schedule when an enabled schedule is still valid", async () => {
    const executeControlledStructuredPlan = vi.fn();
    const { watcher, restore } = loadWatcherWithMocks(tempRoot, {
      listTasks: () => [{ agentName: "planner", status: "queued" }],
      getSchedule: () => ({
        enabled: true,
        cycleCount: 1,
        maxCycles: 3,
      }),
      executeControlledStructuredPlan,
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

      const result = await watcher.evaluateRules();

      expect(result.decisions).toEqual([
        expect.objectContaining({
          matched: true,
          action: "schedule_already_active_or_valid",
        }),
      ]);
      expect(executeControlledStructuredPlan).not.toHaveBeenCalled();
    } finally {
      restore();
    }
  });

  it("previews matching rules without starting schedules or changing watcher state", () => {
    const executeControlledStructuredPlan = vi.fn();
    const { watcher, restore } = loadWatcherWithMocks(tempRoot, {
      listTasks: () => [{ agentName: "researcher", status: "queued" }],
      getSchedule: () => null,
      executeControlledStructuredPlan,
    });

    try {
      watcher.saveWatcherState({
        enabled: true,
        intervalSeconds: 4,
        rules: [
          {
            name: "researcher_queue_rule",
            agentName: "researcher",
            minQueuedTasks: 1,
            scheduleIntervalSeconds: 6,
            scheduleMaxCycles: 4,
            enabled: true,
          },
          {
            name: "disabled_queue_rule",
            agentName: "writer",
            minQueuedTasks: 1,
            scheduleIntervalSeconds: 6,
            scheduleMaxCycles: 4,
            enabled: false,
          },
        ],
        history: [{ type: "existing" }],
      });
      const before = watcher.getWatcherStatus();

      const preview = watcher.previewRules();

      expect(preview.summary).toEqual({
        evaluatedRules: 2,
        matchedRules: 1,
        schedulesThatWouldStart: 1,
      });
      expect(preview.decisions).toEqual([
        expect.objectContaining({
          ruleName: "researcher_queue_rule",
          matched: true,
          action: "schedule_would_start",
        }),
        expect.objectContaining({
          ruleName: "disabled_queue_rule",
          matched: false,
          action: "disabled",
        }),
      ]);
      expect(executeControlledStructuredPlan).not.toHaveBeenCalled();
      expect(watcher.getWatcherStatus()).toEqual(before);
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

  it("captures interval errors into watcher state and telemetry", async () => {
    const recordTelemetry = vi.fn();
    const { watcher, restore } = loadWatcherWithMocks(tempRoot, {
      listTasks: () => [{ agentName: "researcher", status: "queued" }],
      getSchedule: () => null,
      executeControlledStructuredPlan: async () => ({ ok: false, error: "scheduler unavailable" }),
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
      await vi.advanceTimersByTimeAsync(2000);

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

  it("coalesces overlapping watcher evaluations into one governed schedule start", async () => {
    let resolveExecution: ((value: Record<string, unknown>) => void) | null = null;
    const executeControlledStructuredPlan = vi.fn(() => new Promise<Record<string, unknown>>((resolve) => {
      resolveExecution = resolve;
    }));
    const { watcher, restore } = loadWatcherWithMocks(tempRoot, {
      listTasks: () => [{ agentName: "researcher", status: "queued" }],
      getSchedule: () => null,
      executeControlledStructuredPlan,
    });

    try {
      watcher.saveWatcherState({
        enabled: true,
        intervalSeconds: 2,
        rules: [{
          name: "researcher_queue_rule",
          agentName: "researcher",
          minQueuedTasks: 1,
          scheduleIntervalSeconds: 3,
          scheduleMaxCycles: 3,
          enabled: true,
        }],
        history: [],
      });

      const first = watcher.evaluateRules();
      const second = watcher.evaluateRules();

      expect(second).toBe(first);
      expect(executeControlledStructuredPlan).toHaveBeenCalledTimes(1);
      resolveExecution?.({
        ok: true,
        result: {
          ok: true,
          schedule: { enabled: true, intervalSeconds: 3, maxCycles: 3, cycleCount: 0 },
        },
      });
      await expect(first).resolves.toEqual(expect.objectContaining({ ok: true }));
    } finally {
      restore();
    }
  });

  it("starts only one schedule when multiple matching rules target the same agent", async () => {
    let activeSchedule: Record<string, unknown> | null = null;
    const executeControlledStructuredPlan = vi.fn(async (plan: Record<string, unknown>) => {
      const payload = plan.payload as { intervalSeconds: number; maxCycles: number };
      activeSchedule = {
        enabled: true,
        intervalSeconds: payload.intervalSeconds,
        maxCycles: payload.maxCycles,
        cycleCount: 0,
      };
      return { ok: true, result: { ok: true, schedule: activeSchedule } };
    });
    const { watcher, restore } = loadWatcherWithMocks(tempRoot, {
      listTasks: () => [{ agentName: "researcher", status: "queued" }],
      getSchedule: () => activeSchedule,
      executeControlledStructuredPlan,
    });

    try {
      watcher.saveWatcherState({
        enabled: true,
        intervalSeconds: 2,
        rules: [
          {
            name: "researcher_queue_rule_one",
            agentName: "researcher",
            minQueuedTasks: 1,
            scheduleIntervalSeconds: 3,
            scheduleMaxCycles: 3,
            enabled: true,
          },
          {
            name: "researcher_queue_rule_two",
            agentName: "researcher",
            minQueuedTasks: 1,
            scheduleIntervalSeconds: 5,
            scheduleMaxCycles: 2,
            enabled: true,
          },
        ],
        history: [],
      });

      const result = await watcher.evaluateRules();

      expect(executeControlledStructuredPlan).toHaveBeenCalledTimes(1);
      expect(result.decisions.map((decision: { action: string }) => decision.action)).toEqual([
        "schedule_started",
        "schedule_already_active_or_valid",
      ]);
    } finally {
      restore();
    }
  });
});

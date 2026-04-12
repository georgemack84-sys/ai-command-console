import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const originalEnv = { ...process.env };

const schedulerPath = require.resolve("../../services/scheduler.js");
const agentRuntimePath = require.resolve("../../services/agentRuntime.js");
const agentMemoryPath = require.resolve("../../services/agentMemory.js");
const telemetryPath = require.resolve("../../services/telemetry.js");
const stateDatabasePath = require.resolve("../../services/stateDatabase.js");
const runtimePathsPath = require.resolve("../../services/runtimePaths.js");

function createTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "ai-command-console-scheduler-"));
}

function loadSchedulerWithMocks(tempRoot: string, options?: {
  tickAgent?: (agentName: string) => Promise<unknown>;
  startAgent?: (agentName: string, goal: string) => Promise<unknown>;
  loadAgentState?: (agentName: string) => Record<string, unknown>;
  saveAgentState?: (agentName: string, state: Record<string, unknown>) => unknown;
  appendAgentHistory?: (agentName: string, entry: Record<string, unknown>) => void;
  recordTelemetry?: (payload: unknown) => void;
}) {
  process.env = { ...originalEnv, AI_COMMAND_CONSOLE_DATA_ROOT: tempRoot };

  const originalScheduler = require.cache[schedulerPath];
  const originalRuntime = require.cache[agentRuntimePath];
  const originalMemory = require.cache[agentMemoryPath];
  const originalTelemetry = require.cache[telemetryPath];

  require.cache[agentRuntimePath] = {
    id: agentRuntimePath,
    filename: agentRuntimePath,
    loaded: true,
    exports: {
      tickAgent: options?.tickAgent || (async () => ({ ok: true, result: { summary: "tick ok" } })),
      startAgent: options?.startAgent || (async (_agentName: string, goal: string) => ({ ok: true, goal })),
    },
  };
  require.cache[agentMemoryPath] = {
    id: agentMemoryPath,
    filename: agentMemoryPath,
    loaded: true,
    exports: {
      loadAgentState: options?.loadAgentState || (() => ({ active: true, currentTask: null, goal: "Goal" })),
      saveAgentState: options?.saveAgentState || ((_agentName: string, state: Record<string, unknown>) => state),
      appendAgentHistory: options?.appendAgentHistory || (() => {}),
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

  delete require.cache[schedulerPath];
  delete require.cache[stateDatabasePath];
  delete require.cache[runtimePathsPath];

  const scheduler = require("../../services/scheduler.js");
  const stateDatabase = require("../../services/stateDatabase.js");

  return {
    scheduler,
    stateDatabase,
    restore() {
      scheduler.stopSchedule?.("planner", "test_cleanup");
      scheduler.stopSchedule?.("researcher", "test_cleanup");
      stateDatabase.closeDatabase();
      delete require.cache[schedulerPath];
      delete require.cache[stateDatabasePath];
      delete require.cache[runtimePathsPath];

      if (originalScheduler) require.cache[schedulerPath] = originalScheduler;
      else delete require.cache[schedulerPath];
      if (originalRuntime) require.cache[agentRuntimePath] = originalRuntime;
      else delete require.cache[agentRuntimePath];
      if (originalMemory) require.cache[agentMemoryPath] = originalMemory;
      else delete require.cache[agentMemoryPath];
      if (originalTelemetry) require.cache[telemetryPath] = originalTelemetry;
      else delete require.cache[telemetryPath];
    },
  };
}

describe("scheduler service", () => {
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

  it("returns an error result when the schedule is missing or disabled", async () => {
    const recordTelemetry = vi.fn();
    const { scheduler, restore } = loadSchedulerWithMocks(tempRoot, { recordTelemetry });

    try {
      const result = await scheduler.runScheduledTick("planner");

      expect(result).toEqual(
        expect.objectContaining({
          ok: false,
          message: 'No enabled schedule for agent "planner".',
        }),
      );
      expect(recordTelemetry).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "scheduler:tick",
          status: "error",
          meta: expect.objectContaining({
            agentName: "planner",
            reason: "missing_schedule",
          }),
        }),
      );
    } finally {
      restore();
    }
  });

  it("resumes an existing task before ticking the agent", async () => {
    const appendAgentHistory = vi.fn();
    const saveAgentState = vi.fn((_agentName: string, state: Record<string, unknown>) => state);
    const tickAgent = vi.fn(async () => ({ ok: true, result: { summary: "resumed tick" } }));
    const { scheduler, restore } = loadSchedulerWithMocks(tempRoot, {
      tickAgent,
      loadAgentState: () => ({
        active: false,
        currentTask: { id: "task_1" },
        goal: "Resume this",
      }),
      saveAgentState,
      appendAgentHistory,
    });

    try {
      scheduler.startSchedule("planner", 5, 3);
      const result = await scheduler.runScheduledTick("planner");
      const schedule = scheduler.getSchedule("planner");

      expect(result.ok).toBe(true);
      expect(saveAgentState).toHaveBeenCalledWith(
        "planner",
        expect.objectContaining({
          active: true,
          status: "running",
        }),
      );
      expect(appendAgentHistory).toHaveBeenCalledWith(
        "planner",
        expect.objectContaining({
          type: "agent_resumed",
          reason: "scheduler_tick",
        }),
      );
      expect(tickAgent).toHaveBeenCalledWith("planner");
      expect(schedule.cycleCount).toBe(1);
      expect(schedule.lastError).toBeNull();
    } finally {
      restore();
    }
  });

  it("stores exception details on the schedule when a tick throws", async () => {
    const recordTelemetry = vi.fn();
    const { scheduler, restore } = loadSchedulerWithMocks(tempRoot, {
      tickAgent: async () => {
        throw new Error("runtime failed");
      },
      recordTelemetry,
    });

    try {
      scheduler.startSchedule("planner", 5, 3);
      const result = await scheduler.runScheduledTick("planner");
      const schedule = scheduler.getSchedule("planner");

      expect(result).toEqual(
        expect.objectContaining({
          ok: false,
          message: 'Scheduled tick failed for "planner": runtime failed',
        }),
      );
      expect(schedule.lastError).toBe("runtime failed");
      expect(recordTelemetry).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "scheduler:tick",
          status: "error",
          meta: expect.objectContaining({
            reason: "exception",
            error: "runtime failed",
          }),
        }),
      );
    } finally {
      restore();
    }
  });

  it("stops running intervals once a schedule is disabled", async () => {
    const tickAgent = vi.fn(async () => ({ ok: true, result: { summary: "tick ok" } }));
    const { scheduler, restore } = loadSchedulerWithMocks(tempRoot, { tickAgent });

    try {
      scheduler.startSchedule("planner", 2, 5);
      expect(tickAgent).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(2000);
      await vi.runAllTicks();

      expect(tickAgent).toHaveBeenCalledTimes(1);

      scheduler.stopSchedule("planner", "manual_stop");
      await vi.advanceTimersByTimeAsync(4000);
      await vi.runAllTicks();

      expect(tickAgent).toHaveBeenCalledTimes(1);
      expect(scheduler.getSchedule("planner").stopReason).toBe("manual_stop");
    } finally {
      restore();
    }
  });
});

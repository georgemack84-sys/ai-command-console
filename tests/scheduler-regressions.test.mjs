import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "module";
import { restoreFiles, snapshotFiles } from "./helpers/state-fixture.mjs";

const require = createRequire(import.meta.url);

const schedulerModulePath = require.resolve("../services/scheduler");
const agentRuntimePath = require.resolve("../services/agentRuntime");
const agentMemoryPath = require.resolve("../services/agentMemory");

const { saveSchedulerState, loadSchedulerState } = require("../services/scheduler");

const FILES = ["console.sqlite", "scheduler.json"];

function withSchedulerMocks({ runtimeMock, memoryMock }) {
  const originalScheduler = require.cache[schedulerModulePath];
  const originalRuntime = require.cache[agentRuntimePath];
  const originalMemory = require.cache[agentMemoryPath];

  require.cache[agentRuntimePath] = {
    id: agentRuntimePath,
    filename: agentRuntimePath,
    loaded: true,
    exports: runtimeMock,
  };
  require.cache[agentMemoryPath] = {
    id: agentMemoryPath,
    filename: agentMemoryPath,
    loaded: true,
    exports: memoryMock,
  };
  delete require.cache[schedulerModulePath];

  const scheduler = require("../services/scheduler");

  return {
    scheduler,
    restore() {
      delete require.cache[schedulerModulePath];
      if (originalScheduler) {
        require.cache[schedulerModulePath] = originalScheduler;
      }
      if (originalRuntime) {
        require.cache[agentRuntimePath] = originalRuntime;
      } else {
        delete require.cache[agentRuntimePath];
      }
      if (originalMemory) {
        require.cache[agentMemoryPath] = originalMemory;
      } else {
        delete require.cache[agentMemoryPath];
      }
    },
  };
}

test("startSchedule resets stale cycle and error state", () => {
  const snapshot = snapshotFiles(FILES);

  try {
    saveSchedulerState({
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schedules: {
        planner: {
          agentName: "planner",
          enabled: false,
          intervalSeconds: 30,
          maxCycles: 9,
          cycleCount: 9,
          lastRunAt: "2026-03-20T01:00:00.000Z",
          lastResult: null,
          lastError: "stale failure",
          stopReason: "max_cycles_reached",
          createdAt: "2026-03-20T01:00:00.000Z",
          updatedAt: "2026-03-20T01:00:00.000Z",
        },
      },
    });

    const started = require("../services/scheduler").startSchedule("planner", 5, 4);

    assert.equal(started.enabled, true);
    assert.equal(started.cycleCount, 0);
    assert.equal(started.lastError, null);
    assert.equal(started.stopReason, null);
    assert.equal(started.intervalSeconds, 5);
    assert.equal(started.maxCycles, 4);
    require("../services/scheduler").stopSchedule("planner", "test_cleanup");
  } finally {
    restoreFiles(snapshot);
  }
});

test("runScheduledTick does not increment cycle count when the agent rejects work", async () => {
  const snapshot = snapshotFiles(FILES);

  const mocked = withSchedulerMocks({
    runtimeMock: {
      tickAgent: async () => ({ ok: false, message: "Agent is inactive." }),
      startAgent: async () => ({ ok: true, message: "started" }),
    },
    memoryMock: {
      loadAgentState: () => ({ active: true, currentTask: null, goal: "Goal" }),
      saveAgentState: (_agentName, state) => state,
      appendAgentHistory: () => {},
    },
  });

  try {
    saveSchedulerState({
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schedules: {
        planner: {
          agentName: "planner",
          enabled: true,
          intervalSeconds: 5,
          maxCycles: 3,
          cycleCount: 1,
          lastRunAt: null,
          lastResult: null,
          lastError: null,
          stopReason: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    });

    const result = await mocked.scheduler.runScheduledTick("planner");
    const schedule = loadSchedulerState().schedules.planner;

    assert.equal(result.ok, false);
    assert.equal(schedule.cycleCount, 1);
    assert.equal(schedule.lastError, "Agent is inactive.");
  } finally {
    mocked.restore();
    restoreFiles(snapshot);
  }
});

test("runScheduledTick stops the schedule cleanly when max cycles are reached", async () => {
  const snapshot = snapshotFiles(FILES);

  const mocked = withSchedulerMocks({
    runtimeMock: {
      tickAgent: async () => ({ ok: true, message: "tick ok", result: { summary: "Completed bounded step." } }),
      startAgent: async () => ({ ok: true, message: "started" }),
    },
    memoryMock: {
      loadAgentState: () => ({ active: true, currentTask: null, goal: "Goal" }),
      saveAgentState: (_agentName, state) => state,
      appendAgentHistory: () => {},
    },
  });

  try {
    saveSchedulerState({
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schedules: {
        planner: {
          agentName: "planner",
          enabled: true,
          intervalSeconds: 5,
          maxCycles: 2,
          cycleCount: 1,
          lastRunAt: null,
          lastResult: null,
          lastError: null,
          stopReason: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    });

    const result = await mocked.scheduler.runScheduledTick("planner");
    const schedule = loadSchedulerState().schedules.planner;

    assert.equal(result.ok, true);
    assert.equal(schedule.enabled, false);
    assert.equal(schedule.stopReason, "max_cycles_reached");
    assert.equal(schedule.cycleCount, 2);
  } finally {
    mocked.restore();
    restoreFiles(snapshot);
  }
});

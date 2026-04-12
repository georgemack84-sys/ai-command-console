import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const originalEnv = { ...process.env };

const taskQueuePath = require.resolve("../../services/taskQueue.js");
const stateDatabasePath = require.resolve("../../services/stateDatabase.js");
const runtimePathsPath = require.resolve("../../services/runtimePaths.js");

function createTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "ai-command-console-task-queue-"));
}

function loadTaskQueue(tempRoot: string) {
  process.env = { ...originalEnv, AI_COMMAND_CONSOLE_DATA_ROOT: tempRoot };
  delete require.cache[taskQueuePath];
  delete require.cache[stateDatabasePath];
  delete require.cache[runtimePathsPath];

  const taskQueue = require("../../services/taskQueue.js");
  const stateDatabase = require("../../services/stateDatabase.js");

  return {
    taskQueue,
    stateDatabase,
    restore() {
      stateDatabase.closeDatabase();
      delete require.cache[taskQueuePath];
      delete require.cache[stateDatabasePath];
      delete require.cache[runtimePathsPath];
    },
  };
}

describe("task queue service", () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = createTempRoot();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it("sorts tasks by priority first and creation time second", () => {
    const { taskQueue, restore } = loadTaskQueue(tempRoot);

    try {
      taskQueue.saveQueue({
        createdAt: "2026-04-09T00:00:00.000Z",
        tasks: [
          { id: "late-low", agentName: "planner", description: "late low", status: "queued", priority: 3, createdAt: "2026-04-09T00:02:00.000Z" },
          { id: "early-high", agentName: "planner", description: "early high", status: "queued", priority: 1, createdAt: "2026-04-09T00:03:00.000Z" },
          { id: "early-low", agentName: "planner", description: "early low", status: "queued", priority: 3, createdAt: "2026-04-09T00:01:00.000Z" },
        ],
      });

      expect(taskQueue.listTasks().map((task: { id: string }) => task.id)).toEqual([
        "early-high",
        "early-low",
        "late-low",
      ]);
    } finally {
      restore();
    }
  });

  it("claims only the next queued task for the selected agent", () => {
    const { taskQueue, restore } = loadTaskQueue(tempRoot);

    try {
      taskQueue.saveQueue({
        createdAt: "2026-04-09T00:00:00.000Z",
        tasks: [
          { id: "claimed", agentName: "researcher", description: "claimed", status: "claimed", priority: 1, createdAt: "2026-04-09T00:01:00.000Z", claimedAt: "2026-04-09T00:02:00.000Z" },
          { id: "queued-1", agentName: "researcher", description: "queued 1", status: "queued", priority: 2, createdAt: "2026-04-09T00:03:00.000Z" },
          { id: "queued-2", agentName: "researcher", description: "queued 2", status: "queued", priority: 3, createdAt: "2026-04-09T00:04:00.000Z" },
        ],
      });

      const claimed = taskQueue.claimNextTask("researcher");
      expect(claimed.id).toBe("queued-1");
      expect(claimed.status).toBe("claimed");
      expect(claimed.claimedAt).toBeTruthy();
      expect(taskQueue.peekNextTask("researcher").id).toBe("queued-2");
    } finally {
      restore();
    }
  });

  it("updates callbacks and completion state on existing tasks", () => {
    const { taskQueue, restore } = loadTaskQueue(tempRoot);

    try {
      const task = taskQueue.addTask("builder", "Ship the dashboard", {
        callbackEnabled: false,
        notifyAgent: "ops",
      });

      const callback = taskQueue.setTaskCallback(task.id, {
        callbackSummary: "Ready for review",
        callbackSentAt: "2026-04-09T01:00:00.000Z",
      });
      expect(callback.callback).toEqual(
        expect.objectContaining({
          enabled: false,
          notifyAgent: "ops",
          callbackSummary: "Ready for review",
          callbackSentAt: "2026-04-09T01:00:00.000Z",
        }),
      );

      const completed = taskQueue.completeTask(task.id, { ok: true });
      expect(completed.status).toBe("completed");
      expect(completed.completedAt).toBeTruthy();
      expect(completed.result).toEqual({ ok: true });
    } finally {
      restore();
    }
  });
});
